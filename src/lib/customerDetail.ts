import "server-only";
import { readJson } from "./store";
import { listFulfillment, type FulfillmentOrder } from "./fulfillment";
import { listOrders, type OrderRecord } from "./orders";
import {
  normalizePhone,
  type Customer,
  type CustomerQuote,
} from "./customers";
import { hasDueDatePassed, paidTotal, remaining } from "./payment";

export interface SuchidartaRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  signatory: string;
  sentTo: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

export interface CustomerTicket {
  id: string;
  ticketNo?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
}

export interface CustomerDetailSummary {
  quotesSent: number;
  quotesFailed: number;
  suchidarta: number;
  siteRequests: number;
  orders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  bills: number;
  billBhuktani: number;
  tickets: number;
  openTickets: number;
  billed: number;
  paid: number;
  outstanding: number;
  overdueBills: number;
  lastActivity: string | null;
}

export interface CustomerDetail {
  customer: Customer;
  quotes: CustomerQuote[];
  suchidarta: SuchidartaRecord[];
  siteRequests: OrderRecord[];
  fulfillment: FulfillmentOrder[];
  tickets: CustomerTicket[];
  summary: CustomerDetailSummary;
}

type StoredCustomer = Customer & { suchidarta?: SuchidartaRecord[] };

interface Candidate {
  customerId?: string;
  email?: string;
  phone?: string;
}

function normEmail(v?: string): string {
  return (v ?? "").trim().toLowerCase();
}

function matches(c: Customer, cand: Candidate): boolean {
  if (cand.customerId && c.id === cand.customerId) return true;
  if (cand.email && normEmail(cand.email)) {
    if (normEmail(c.email) === normEmail(cand.email)) return true;
  }
  if (cand.phone && normalizePhone(cand.phone)) {
    if (normalizePhone(c.phone) === normalizePhone(cand.phone)) return true;
  }
  return false;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeSummary(deps: {
  quotes: CustomerQuote[];
  suchidarta: SuchidartaRecord[];
  siteRequests: OrderRecord[];
  fulfillment: FulfillmentOrder[];
  tickets: CustomerTicket[];
}): CustomerDetailSummary {
  const { quotes, suchidarta, siteRequests, fulfillment, tickets } = deps;

  let billed = 0;
  let paid = 0;
  let outstanding = 0;
  let overdueBills = 0;
  let bills = 0;
  let billBhuktani = 0;
  let activeOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;

  for (const o of fulfillment) {
    if (o.status === "new" || o.status === "preparing" || o.status === "ready") {
      activeOrders += 1;
    } else if (o.status === "delivered") {
      deliveredOrders += 1;
    } else if (o.status === "cancelled") {
      cancelledOrders += 1;
    }
    billBhuktani += (o.billBhuktani ?? []).length;
    if (o.billNo) {
      bills += 1;
      billed += o.total;
      paid += paidTotal(o);
      const due = remaining(o);
      if (due > 0.005) {
        outstanding += due;
        if (hasDueDatePassed(o)) overdueBills += 1;
      }
    }
  }

  const timestamps = [
    ...quotes.map((q) => q.sentAt),
    ...suchidarta.map((s) => s.sentAt),
    ...siteRequests.map((r) => r.createdAt),
    ...fulfillment.flatMap((o) => [
      o.createdAt,
      o.updatedAt ?? "",
      o.billedAt ?? "",
      o.paidAt ?? "",
    ]),
    ...tickets.map((t) => t.createdAt),
  ].filter(Boolean);
  const lastActivity = timestamps.length
    ? [...timestamps].sort().reverse()[0]
    : null;

  return {
    quotesSent: quotes.filter((q) => q.status === "sent").length,
    quotesFailed: quotes.filter((q) => q.status === "failed").length,
    suchidarta: suchidarta.length,
    siteRequests: siteRequests.length,
    orders: fulfillment.length,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    bills,
    billBhuktani,
    tickets: tickets.length,
    openTickets: tickets.filter((t) => t.status !== "resolved").length,
    billed: round(billed),
    paid: round(paid),
    outstanding: round(outstanding),
    overdueBills,
    lastActivity,
  };
}

export async function aggregateCustomer(
  id: string
): Promise<CustomerDetail | null> {
  let customers: StoredCustomer[] = [];
  try {
    customers = await readJson<StoredCustomer[]>("customers.json");
  } catch {
    customers = [];
  }
  const customer = customers.find((c) => c.id === id) ?? null;
  if (!customer) return null;

  const quotes = customer.quotes ?? [];
  const suchidarta = customer.suchidarta ?? [];

  const fulfillmentAll = await listFulfillment();
  const fulfillment = fulfillmentAll.filter((o) =>
    matches(customer, {
      customerId: o.customerId,
      email: o.customerEmail,
      phone: o.customerPhone,
    })
  );

  const ordersAll = await listOrders();
  const siteRequests = ordersAll.filter((o) =>
    matches(customer, {
      customerId: o.customerId,
      email: o.email,
      phone: o.phone,
    })
  );

  let tickets: CustomerTicket[] = [];
  try {
    tickets = await readJson<CustomerTicket[]>("tickets.json");
  } catch {
    tickets = [];
  }
  tickets = tickets.filter((t) => matches(customer, { email: t.email, phone: t.phone }));

  const summary = computeSummary({
    quotes,
    suchidarta,
    siteRequests,
    fulfillment,
    tickets,
  });

  return { customer, quotes, suchidarta, siteRequests, fulfillment, tickets, summary };
}
