import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { renderBillHtml, type BillParty } from "@/lib/bill";
import {
  getFulfillment,
  listFulfillment,
  nextBillNo,
  saveFulfillment,
  DEFAULT_PAYMENT_DAYS,
  addDaysIso,
  type FulfillmentOrder,
} from "@/lib/fulfillment";
import { paidTotal, paymentStatus } from "@/lib/payment";
import { listOrders, updateOrder } from "@/lib/orders";
import { signatureName } from "@/lib/quotation";
import { publicUrlAsDataUri } from "@/lib/embed";
import { stampDataUrl } from "@/lib/stamp";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales", "saleshead"];

interface SiteInfo {
  name?: string;
  contact?: {
    email?: string;
    address?: string;
    phones?: { label: string }[];
    vatNo?: string;
  };
}

async function companyInfo() {
  let site: SiteInfo = {};
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = {};
  }
  const contact = site.contact ?? {};
  return {
    name: site.name ?? "TechBucket",
    email: contact.email ?? "",
    address: contact.address ?? "",
    phones: (contact.phones ?? []).map((p) => p.label),
    vatNo: contact.vatNo ?? "",
  };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderId = (body.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "Order id is required." },
      { status: 400 }
    );
  }

  const order = await getFulfillment(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "delivered") {
    return NextResponse.json(
      { error: "Only delivered orders can be billed." },
      { status: 400 }
    );
  }
  if (order.billNo) {
    return NextResponse.json(
      { error: `This order is already billed as ${order.billNo}.` },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const billedDate = now.slice(0, 10);
  const updated: FulfillmentOrder = {
    ...order,
    updatedAt: now,
    billNo: await nextBillNo(),
    billedAt: now,
    billedBy: user.name,
    payments: [],
    paymentDueDate: addDaysIso(billedDate, DEFAULT_PAYMENT_DAYS),
    events: [
      ...order.events,
      {
        at: now,
        by: user.name,
        role: user.role,
        from: order.status,
        to: order.status,
        note: `Bill issued`,
      },
    ],
  };

  const orders = await listFulfillment();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  orders[idx] = updated;
  await saveFulfillment(orders);

  const linked = (await listOrders()).find(
    (o) => o.fulfillmentOrderId === orderId
  );
  if (linked) {
    await updateOrder(linked.id, { billNo: updated.billNo });
  }

  return NextResponse.json({ ok: true, order: updated });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const orderId = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!orderId) {
    return new Response("Missing order id", { status: 400 });
  }

  const order = await getFulfillment(orderId);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }
  if (!order.billNo) {
    return new Response("This order has not been billed yet", { status: 404 });
  }

  const company = await companyInfo();

  const billTo: BillParty = {
    name: order.customerName,
    email: order.customerEmail,
    company: order.customerCompany,
    address: order.customerAddress,
    phone: order.customerPhone,
  };
  const billedBy: BillParty = {
    name:
      order.billedBy ||
      signatureName(user.signatory, user.name) ||
      user.name,
    email: company.email,
    title: user.designation || undefined,
    signature: publicUrlAsDataUri(user.signature || undefined),
    stamp: await stampDataUrl(),
  };

  const html = renderBillHtml({
    origin: req.nextUrl.origin,
    company,
    bill: {
      billNo: order.billNo,
      orderNo: order.orderNo,
      quoteNo: order.quoteNo,
      date: (order.billedAt ?? order.createdAt).slice(0, 10),
      items: order.items.map((i) => ({
        type: i.type,
        description: i.name,
        qty: i.qty,
        price: i.price,
      })),
      vatRate: order.vatRate,
      discountPercent: order.discountPercent ?? 0,
      discountAmount: order.discountAmount ?? 0,
      subtotal: order.subtotal,
      vat: order.vat,
      total: order.total,
      notes: order.notes,
      dueDate: order.paymentDueDate,
      paid: paidTotal(order),
      received: paymentStatus(order) === "received",
    },
    billedBy,
    billTo,
    letterhead: true,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
