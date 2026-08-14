import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUsers, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { resolveSender, sendMailWith } from "@/lib/mail";
import { updateOrder } from "@/lib/orders";
import {
  getFulfillment,
  listFulfillment,
  newFulfillmentId,
  nextOrderNo,
  nextReceiptNo,
  saveFulfillment,
  isVerified,
  paidTotal,
  paymentStatus,
  remaining,
  activePayments,
  PAYMENT_METHODS,
  ORDER_TYPE_LABELS,
  type FulfillmentOrder,
  type FulfillmentStatus,
  type OrderType,
  type PaymentRecord,
  type PaymentMethod,
} from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

const ALLOWED: AdminRole[] = ["superadmin", "sales", "saleshead", "logistics", "support"];
const VERIFIERS: AdminRole[] = ["superadmin", "support"];
const PAYMENT_TAKERS: AdminRole[] = ["superadmin", "logistics"];
const CREATORS: AdminRole[] = ["superadmin", "sales", "saleshead"];
const ALL_STATUSES: FulfillmentStatus[] = [
  "new",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];
const ORDER_TYPES: OrderType[] = ["delivery", "pickup"];

interface QuoteItem {
  type: "item" | "service";
  description: string;
  qty: number;
  price: number;
}

interface Quote {
  id: string;
  quoteNo?: string;
  items?: QuoteItem[];
  vatRate?: number;
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  vat?: number;
  total?: number;
  status?: string;
  orderId?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  quotes?: Quote[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(n: number): string {
  return `Rs. ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function findQuote(
  customers: Customer[],
  quoteId: string
): { customer: Customer; quote: Quote } | null {
  for (const c of customers) {
    const q = (c.quotes ?? []).find((x) => x.id === quoteId);
    if (q) return { customer: c, quote: q };
  }
  return null;
}

function canTransition(
  role: AdminRole,
  username: string,
  order: FulfillmentOrder,
  to: FulfillmentStatus
): boolean {
  if (role === "superadmin") return true;
  const from = order.status;
  if (role === "logistics") {
    if (from === "new" && to === "preparing") return true;
    if (from === "preparing" && to === "ready") return true;
    if (
      from === "ready" &&
      to === "delivered" &&
      order.orderType === "delivery" &&
      isVerified(order)
    )
      return true;
    return false;
  }
  if (role === "sales" || role === "saleshead") {
    if (from === "new" && to === "cancelled" && order.createdBy === username)
      return true;
    if (
      from === "ready" &&
      to === "delivered" &&
      order.orderType === "pickup" &&
      isVerified(order)
    )
      return true;
    return false;
  }
  return false;
}

async function notifyRole(
  roles: AdminRole[],
  order: FulfillmentOrder,
  subject: string,
  intro: string,
  closing: string
): Promise<boolean> {
  const users = await getUsers();
  const recipients = users
    .filter(
      (u) => roles.includes(u.role) && u.active && (u.email ?? "").trim().length > 0
    )
    .map((u) => u.email.trim());
  if (recipients.length === 0) return false;

  const sender = await resolveSender();
  if (!sender) return false;
  const config = {
    host: sender.host,
    port: sender.port,
    secure: sender.secure,
    user: sender.email,
    pass: sender.pass,
  };

  const lines = order.items
    .map((it) => `- ${it.name} x${it.qty} — ${money(it.total)}`)
    .join("\n");

  let sent = 0;
  for (const to of recipients) {
    const result = await sendMailWith(config, {
      fromName: "TechBucket Fulfillment",
      to,
      subject,
      text: [
        `${intro} ${order.orderNo} (from quote ${order.quoteNo}).`,
        "",
        `Customer: ${order.customerName} <${order.customerEmail}>`,
        `Order type: ${ORDER_TYPE_LABELS[order.orderType]}`,
        "",
        lines,
        "",
        `Total: ${money(order.total)}`,
        "",
        closing,
      ].join("\n"),
      html: `
        <h2>${esc(subject)}</h2>
        <p>${esc(intro)} <strong>${esc(
        order.orderNo
      )}</strong> (from quote ${esc(order.quoteNo)}).</p>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
          <tr><th align="left" style="border:1px solid #ddd;padding:8px">Item</th><th align="left" style="border:1px solid #ddd;padding:8px">Qty</th><th align="left" style="border:1px solid #ddd;padding:8px">Amount</th></tr>
          ${order.items
            .map(
              (it) =>
                `<tr><td style="border:1px solid #ddd;padding:8px">${esc(it.name)}</td><td style="border:1px solid #ddd;padding:8px">${it.qty}</td><td style="border:1px solid #ddd;padding:8px">${money(it.total)}</td></tr>`
            )
            .join("")}
        </table>
        <p><strong>Customer:</strong> ${esc(order.customerName)} &lt;${esc(
        order.customerEmail
      )}&gt;${order.customerPhone ? ` · ${esc(order.customerPhone)}` : ""}</p>
        <p><strong>Order type:</strong> ${esc(
          ORDER_TYPE_LABELS[order.orderType]
        )}</p>
        <p><strong>Total:</strong> ${money(order.total)}</p>
        <p style="color:#555">${esc(closing)}</p>
        <p style="color:#888;font-size:12px">Manage this order in the TechBucket admin panel (Fulfillment tab).</p>
      `,
    });
    if (result.ok) sent += 1;
  }
  return sent > 0;
}

async function notifySupport(order: FulfillmentOrder): Promise<boolean> {
  const closing =
    "Please verify the prepared devices and record your verification in the Fulfillment tab so the order can proceed.";
  return notifyRole(
    ["support"],
    order,
    `Devices ready for verification — ${order.orderNo}`,
    "Order",
    closing
  );
}

async function notifySalesVerified(
  order: FulfillmentOrder,
  verifiedByName: string
): Promise<boolean> {
  const delivery =
    order.orderType === "delivery"
      ? "Logistics will deliver the devices directly to the customer."
      : "Please arrange handover to the customer (pickup / delivery from the office).";
  const closing = `Devices were verified by ${verifiedByName}. ${delivery}`;
  return notifyRole(
    ["sales", "saleshead"],
    order,
    `Devices verified — ${order.orderNo}`,
    "Order",
    closing
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orders = await listFulfillment();
  orders.sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
  );
  return NextResponse.json({ data: orders });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !CREATORS.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { quoteId?: string; orderType?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const quoteId = (body.quoteId ?? "").trim();
  if (!quoteId) {
    return NextResponse.json(
      { error: "Quote is required." },
      { status: 400 }
    );
  }
  const orderType = (body.orderType ?? "").trim() as OrderType;
  if (!ORDER_TYPES.includes(orderType)) {
    return NextResponse.json(
      { error: "Choose a valid order type." },
      { status: 400 }
    );
  }
  const notes = String(body.notes ?? "").trim().slice(0, 2000);

  const customers = await readJson<Customer[]>("customers.json");
  const found = findQuote(customers, quoteId);
  if (!found) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }
  if (found.quote.status !== "sent") {
    return NextResponse.json(
      { error: "Only sent quotes can be converted to an order." },
      { status: 400 }
    );
  }

  const orders = await listFulfillment();
  const existing = orders.find((o) => o.quoteId === quoteId);
  if (existing) {
    return NextResponse.json(
      { error: `This quote is already converted to ${existing.orderNo}.` },
      { status: 400 }
    );
  }

  const items = (found.quote.items ?? []).map((i) => ({
    type: i.type,
    name: i.description,
    qty: i.qty,
    price: i.price,
    total: round2(i.qty * i.price),
  }));
  if (items.length === 0) {
    return NextResponse.json(
      { error: "This quote has no items." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const order: FulfillmentOrder = {
    id: newFulfillmentId(),
    orderNo: await nextOrderNo(),
    quoteId,
    quoteNo: found.quote.quoteNo ?? "",
    customerId: found.customer.id,
    customerName: found.customer.name,
    customerEmail: found.customer.email,
    customerPhone: found.customer.phone,
    customerCompany: found.customer.company,
    customerAddress: found.customer.address,
    items,
    subtotal: Number(found.quote.subtotal) || round2(items.reduce((s, i) => s + i.total, 0)),
    discountPercent: found.quote.discountPercent,
    discountAmount: found.quote.discountAmount,
    vatRate: Number(found.quote.vatRate) || 0,
    vat: Number(found.quote.vat) || 0,
    total: Number(found.quote.total) || 0,
    orderType,
    notes: notes || undefined,
    createdBy: user.username,
    createdByName: user.name,
    createdAt: now,
    status: "new",
    updatedAt: now,
    events: [
      {
        at: now,
        by: user.name,
        role: user.role,
        from: "—",
        to: "new",
        note: notes || undefined,
      },
    ],
  };

  orders.push(order);
  await saveFulfillment(orders);

  if (found.quote.orderId) {
    await updateOrder(found.quote.orderId, {
      fulfillmentOrderId: order.id,
      convertedAt: now,
    });
  }

  return NextResponse.json({ ok: true, order });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    id?: string;
    status?: string;
    action?: string;
    note?: string;
    amount?: number;
    index?: number;
    reason?: string;
    method?: string;
    ref?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  }
  const note = String(body.note ?? "").trim().slice(0, 500) || undefined;

  const order = await getFulfillment(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (body.action === "verify") {
    if (!VERIFIERS.includes(user.role)) {
      return NextResponse.json(
        { error: "You are not allowed to verify this order." },
        { status: 403 }
      );
    }
    if (order.status !== "ready") {
      return NextResponse.json(
        { error: "Only orders marked ready can be verified." },
        { status: 400 }
      );
    }
    if (isVerified(order)) {
      return NextResponse.json(
        { error: "This order is already verified." },
        { status: 400 }
      );
    }
    if (!note) {
      return NextResponse.json(
        { error: "A verification note is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const verified: FulfillmentOrder = {
      ...order,
      updatedAt: now,
      verifiedAt: now,
      verifiedBy: user.username,
      verifiedByName: user.name,
      verifiedNote: note,
      events: [
        ...order.events,
        {
          at: now,
          by: user.name,
          role: user.role,
          from: "ready",
          to: "ready",
          note,
          action: "verify",
        },
      ],
    };

    const orders = await listFulfillment();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    orders[idx] = verified;
    await saveFulfillment(orders);

    const notified = await notifySalesVerified(verified, user.name);
    return NextResponse.json({ ok: true, order: verified, notified });
  }

  if (body.action === "payment") {
    if (!PAYMENT_TAKERS.includes(user.role)) {
      return NextResponse.json(
        { error: "You are not allowed to record payments." },
        { status: 403 }
      );
    }
    if (!order.billNo) {
      return NextResponse.json(
        { error: "This order has no bill yet." },
        { status: 400 }
      );
    }
    const paid = paidTotal(order);
    const due = Math.round((order.total - paid) * 100) / 100;
    if (due <= 0) {
      return NextResponse.json(
        { error: "This bill is already fully paid." },
        { status: 400 }
      );
    }
    const amountRaw = Number(body.amount ?? NaN);
    const amount = Math.round((Number.isFinite(amountRaw) ? amountRaw : 0) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Enter a valid payment amount." },
        { status: 400 }
      );
    }
    if (amount > due + 0.005) {
      return NextResponse.json(
        { error: `Payment exceeds the remaining balance (${due}).` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const method = (body.method ?? "").trim() as PaymentMethod;
    const ref = String(body.ref ?? "").trim().slice(0, 100) || undefined;
    const record: PaymentRecord = {
      amount,
      at: now,
      by: user.name,
      note,
      method: PAYMENT_METHODS.includes(method) ? method : undefined,
      ref,
      receiptNo: await nextReceiptNo(),
    };
    const payments = [...(order.payments ?? []), record];
    const newPaid = Math.round((paid + amount) * 100) / 100;
    const fullyPaid = newPaid >= order.total;

    const paidOrder: FulfillmentOrder = {
      ...order,
      updatedAt: now,
      payments,
      paidAt: fullyPaid ? now : order.paidAt,
      paidBy: fullyPaid ? user.name : order.paidBy,
      events: [
        ...order.events,
        {
          at: now,
          by: user.name,
          role: user.role,
          from: "bill",
          to: fullyPaid ? "received" : "partial",
          note: note || `Payment ${amount} recorded`,
          amount,
          action: "payment",
        },
      ],
    };

    const orders = await listFulfillment();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    orders[idx] = paidOrder;
    await saveFulfillment(orders);

    return NextResponse.json({
      ok: true,
      order: paidOrder,
      paymentStatus: paymentStatus(paidOrder),
      receiptNo: record.receiptNo,
    });
  }

  if (body.action === "void-payment") {
    if (!PAYMENT_TAKERS.includes(user.role)) {
      return NextResponse.json(
        { error: "You are not allowed to void payments." },
        { status: 403 }
      );
    }
    const index = Number(body.index ?? -1);
    const payments = [...(order.payments ?? [])];
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= payments.length
    ) {
      return NextResponse.json(
        { error: "Invalid payment." },
        { status: 400 }
      );
    }
    if (payments[index].voided) {
      return NextResponse.json(
        { error: "This payment is already voided." },
        { status: 400 }
      );
    }
    const reason = String(body.reason ?? body.note ?? "").trim();
    if (!reason) {
      return NextResponse.json(
        { error: "A reason is required to void a payment." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    payments[index] = {
      ...payments[index],
      voided: true,
      voidedAt: now,
      voidedBy: user.name,
      voidReason: reason,
    };

    const active = activePayments({ payments });
    const activePaid = active.reduce((s, p) => s + (p.amount || 0), 0);
    const fullyPaid = activePaid >= order.total;

    const nextOrder: FulfillmentOrder = {
      ...order,
      updatedAt: now,
      payments,
      paidAt: fullyPaid ? order.paidAt : undefined,
      paidBy: fullyPaid ? order.paidBy : undefined,
      events: [
        ...order.events,
        {
          at: now,
          by: user.name,
          role: user.role,
          from: "bill",
          to: fullyPaid ? "payment" : "voided",
          note: `Voided payment ${payments[index].amount} — ${reason}`,
          action: "void",
        },
      ],
    };

    const orders = await listFulfillment();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    orders[idx] = nextOrder;
    await saveFulfillment(orders);

    return NextResponse.json({
      ok: true,
      order: nextOrder,
      paymentStatus: paymentStatus(nextOrder),
    });
  }

  if (body.action === "void-bill") {
    if (user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only the superadmin can void a bill." },
        { status: 403 }
      );
    }
    if (!order.billNo) {
      return NextResponse.json(
        { error: "This order has no bill to void." },
        { status: 400 }
      );
    }
    const reason = String(body.reason ?? body.note ?? "").trim();
    if (!reason) {
      return NextResponse.json(
        { error: "A reason is required to void a bill." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const voidedBillNo = order.billNo;
    const nextOrder: FulfillmentOrder = {
      ...order,
      updatedAt: now,
      billNo: undefined,
      billedAt: undefined,
      billedBy: undefined,
      paymentDueDate: undefined,
      payments: undefined,
      paidAt: undefined,
      paidBy: undefined,
      status: "delivered",
      events: [
        ...order.events,
        {
          at: now,
          by: user.name,
          role: user.role,
          from: "bill",
          to: "delivered",
          note: `Voided bill ${voidedBillNo} — ${reason}`,
          action: "void-bill",
        },
      ],
    };

    const orders = await listFulfillment();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    orders[idx] = nextOrder;
    await saveFulfillment(orders);

    return NextResponse.json({ ok: true, order: nextOrder });
  }

  const status = (body.status ?? "").trim() as FulfillmentStatus;
  if (!ALL_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (order.status === status) {
    return NextResponse.json(
      { error: `Order is already marked ${status}.` },
      { status: 400 }
    );
  }
  if (!canTransition(user.role, user.username, order, status)) {
    return NextResponse.json(
      { error: "You are not allowed to make that change." },
      { status: 403 }
    );
  }

  if (status === "cancelled" && order.billNo && remaining(order) > 0) {
    return NextResponse.json(
      {
        error:
          "This order has an unpaid bill. Collect or void the receivable before cancelling.",
      },
      { status: 400 }
    );
  }

  const from = order.status;
  const now = new Date().toISOString();
  const updated: FulfillmentOrder = {
    ...order,
    status,
    updatedAt: now,
    events: [
      ...order.events,
      {
        at: now,
        by: user.name,
        role: user.role,
        from,
        to: status,
        note,
      },
    ],
  };

  const orders = await listFulfillment();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  orders[idx] = updated;
  await saveFulfillment(orders);

  let notified = false;
  if (status === "ready") {
    notified = await notifySupport(updated);
  }

  return NextResponse.json({ ok: true, order: updated, notified });
}
