import { NextRequest } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { getFulfillment } from "@/lib/fulfillment";
import { paidTotal } from "@/lib/payment";
import {
  renderReceiptHtml,
  type ReceiptParty,
} from "@/lib/receipt";
import { publicUrlAsDataUri } from "@/lib/embed";
import { stampDataUrl } from "@/lib/stamp";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales", "logistics"];

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

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const orderId = (req.nextUrl.searchParams.get("id") ?? "").trim();
  const index = Number(req.nextUrl.searchParams.get("index") ?? -1);

  if (!orderId) {
    return new Response("Missing order id", { status: 400 });
  }

  const order = await getFulfillment(orderId);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }
  if (!order.billNo) {
    return new Response("This order has no bill", { status: 404 });
  }
  const payments = order.payments ?? [];
  if (!Number.isInteger(index) || index < 0 || index >= payments.length) {
    return new Response("Invalid payment", { status: 400 });
  }
  const payment = payments[index];
  if (payment.voided) {
    return new Response("This payment was voided", { status: 400 });
  }
  if (!payment.receiptNo) {
    return new Response("This payment has no receipt number", { status: 400 });
  }

  const company = await companyInfo();
  const receivedBy: ReceiptParty = {
    name: user.name,
    email: user.email,
    title: user.designation || undefined,
    signature: publicUrlAsDataUri(user.signature || undefined),
    stamp: await stampDataUrl(),
  };

  const paidSoFar = paidTotal(order);
  const balance = Math.round((order.total - paidSoFar) * 100) / 100;

  const html = renderReceiptHtml({
    origin: req.nextUrl.origin,
    company,
    receipt: {
      receiptNo: payment.receiptNo,
      receiptAt: payment.at,
      orderNo: order.orderNo,
      quoteNo: order.quoteNo,
      billNo: order.billNo,
      customer: {
        name: order.customerName,
        company: order.customerCompany,
        email: order.customerEmail,
        address: order.customerAddress,
        phone: order.customerPhone,
      },
      total: order.total,
      paid: payment.amount,
      balance,
      method: payment.method,
      ref: payment.ref,
      note: payment.note,
    },
    receivedBy,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
