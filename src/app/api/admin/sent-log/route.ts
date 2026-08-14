import { NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { listFulfillment } from "@/lib/fulfillment";
import type { SentLogEntry } from "@/lib/sentLog";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin"];

interface QuoteRecord {
  id: string;
  quoteNo?: string;
  subject: string;
  total?: number;
  to: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface SuchidartaRecord {
  id: string;
  recipient: string;
  subject: string;
  sentTo: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface Customer {
  id: string;
  name: string;
  email: string;
  quotes?: QuoteRecord[];
  suchidarta?: SuchidartaRecord[];
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let customers: Customer[] = [];
  try {
    customers = await readJson<Customer[]>("customers.json");
  } catch {
    customers = [];
  }

  const entries: SentLogEntry[] = [];
  for (const c of customers) {
    for (const q of c.quotes ?? []) {
      entries.push({
        type: "quote",
        id: q.id,
        quoteNo: q.quoteNo,
        subject: q.subject,
        total: q.total,
        to: q.to,
        sentBy: q.sentBy,
        sentAt: q.sentAt,
        status: q.status,
        customerId: c.id,
        customerName: c.name,
        customerEmail: c.email,
      });
    }
    for (const r of c.suchidarta ?? []) {
      entries.push({
        type: "suchidarta",
        id: r.id,
        recipient: r.recipient,
        sentTo: r.sentTo,
        sentBy: r.sentBy,
        sentAt: r.sentAt,
        status: r.status,
        customerId: c.id,
        customerName: c.name,
        customerEmail: c.email,
      });
    }
  }

  const fulfillment = await listFulfillment();
  for (const o of fulfillment) {
    if (!o.billNo) continue;
    entries.push({
      type: "bill",
      id: o.id,
      billNo: o.billNo,
      orderNo: o.orderNo,
      subject: `Bill ${o.billNo} for ${o.customerName}`,
      total: o.total,
      billedBy: o.billedBy ?? "",
      billedAt: o.billedAt ?? o.updatedAt ?? o.createdAt,
      status: "issued",
      customerId: o.customerId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
    });
    for (const r of o.billBhuktani ?? []) {
      entries.push({
        type: "billbhuktani",
        id: r.id,
        billNo: o.billNo,
        recipient: r.recipient,
        sentTo: r.sentTo,
        sentBy: r.sentBy,
        sentAt: r.sentAt,
        status: r.status,
        customerId: o.customerId,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
      });
    }
  }

  entries.sort((a, b) => {
    const ta = a.type === "bill" ? a.billedAt : a.sentAt;
    const tb = b.type === "bill" ? b.billedAt : b.sentAt;
    return ta < tb ? 1 : ta > tb ? -1 : 0;
  });

  return NextResponse.json({ data: entries });
}
