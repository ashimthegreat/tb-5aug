import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { writeJson } from "@/lib/store";
import {
  listCustomers,
  findCustomer,
  type Customer,
} from "@/lib/customers";
import {
  listFulfillment,
  newFulfillmentId,
  nextOrderNo,
  nextBillNo,
  saveFulfillment,
  DEFAULT_PAYMENT_DAYS,
  addDaysIso,
  type FulfillmentOrder,
  type OrderType,
} from "@/lib/fulfillment";
import { listOrders, updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales", "saleshead"];
const ORDER_TYPES: OrderType[] = ["delivery", "pickup"];
const VAT_RATE = 13;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { orderId?: string; orderType?: string; notes?: string };
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
  const orderType = (body.orderType ?? "delivery").trim() as OrderType;
  if (!ORDER_TYPES.includes(orderType)) {
    return NextResponse.json(
      { error: "Choose a valid order type." },
      { status: 400 }
    );
  }
  const notes = String(body.notes ?? "").trim().slice(0, 2000) || undefined;

  const orders = await listOrders();
  const record = orders.find((o) => o.id === orderId);
  if (!record) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (record.type !== "order") {
    return NextResponse.json(
      {
        error:
          "Only product orders with a listed price can be billed directly.",
      },
      { status: 400 }
    );
  }
  if (record.fulfillmentOrderId) {
    return NextResponse.json(
      { error: "This order has already been converted." },
      { status: 400 }
    );
  }
  const sumItems = round2(
    record.items.reduce(
      (s, i) => s + (Number.isFinite(i.total) ? i.total : i.qty * i.price),
      0
    )
  );
  const listedTotal = Number.isFinite(record.subtotal)
    ? round2(record.subtotal ?? 0)
    : sumItems;
  if (!(listedTotal > 0)) {
    return NextResponse.json(
      { error: "This order has no priced items to bill." },
      { status: 400 }
    );
  }

  const customers = await listCustomers();
  let customer: Customer | null = null;
  if (record.customerId) {
    customer = customers.find((c) => c.id === record.customerId) ?? null;
  }
  if (!customer) {
    customer = findCustomer(customers, record.phone, record.email);
  }
  if (!customer) {
    customer = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: record.customerName,
      email: record.email,
      phone: record.phone,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
    };
    customers.push(customer);
    await writeJson("customers.json", customers);
  }

  const items = record.items.map((i) => {
    const listedPrice = round2(Number.isFinite(i.price) ? i.price : 0);
    const preVat = round2(listedPrice / (1 + VAT_RATE / 100));
    return {
      type: "item" as const,
      name: i.name,
      qty: i.qty,
      price: preVat,
      total: round2(preVat * i.qty),
    };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.total, 0));
  const vat = round2(listedTotal - subtotal);

  const now = new Date().toISOString();
  const billNo = await nextBillNo();
  const fulfillment: FulfillmentOrder = {
    id: newFulfillmentId(),
    orderNo: await nextOrderNo(),
    quoteId: "",
    quoteNo: "",
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerCompany: customer.company,
    customerAddress: customer.address,
    items,
    subtotal,
    vatRate: VAT_RATE,
    vat,
    total: listedTotal,
    orderType,
    notes,
    createdBy: user.username,
    createdByName: user.name,
    createdAt: now,
    status: "new",
    updatedAt: now,
    billNo,
    billedAt: now,
    billedBy: user.name,
    payments: [],
    paymentDueDate: addDaysIso(now.slice(0, 10), DEFAULT_PAYMENT_DAYS),
    events: [
      {
        at: now,
        by: user.name,
        role: user.role,
        from: "—",
        to: "new",
        note: notes || "Direct order from site (no quote)",
      },
      {
        at: now,
        by: user.name,
        role: user.role,
        from: "new",
        to: "new",
        note: `Bill ${billNo} issued (direct order)`,
      },
    ],
  };

  const all = await listFulfillment();
  all.push(fulfillment);
  await saveFulfillment(all);

  await updateOrder(record.id, {
    customerId: customer.id,
    convertedAt: now,
    fulfillmentOrderId: fulfillment.id,
    billNo,
  });

  return NextResponse.json({ ok: true, order: fulfillment });
}
