import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";
import { resolveSender, sendMailWith } from "@/lib/mail";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales"];
const DEFAULT_VAT = 13;

interface QuoteItem {
  type: "item" | "service";
  description: string;
  qty: number;
  price: number;
}

interface Quote {
  id: string;
  quoteNo: string;
  to: string;
  subject: string;
  items: QuoteItem[];
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
  notes: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
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

function money(n: number): string {
  return `NPR ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function quoteDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function itemsTable(rows: QuoteItem[], label: string): string {
  const body = rows
    .map(
      (r) =>
        `<tr>
          <td style="border:1px solid #e5e7eb;padding:8px;text-align:center">${r.qty}</td>
          <td style="border:1px solid #e5e7eb;padding:8px">${esc(r.description)}</td>
          <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${money(r.price)}</td>
          <td style="border:1px solid #e5e7eb;padding:8px;text-align:right">${money(r.qty * r.price)}</td>
        </tr>`
    )
    .join("");
  return `
    <h3 style="font-size:14px;margin:20px 0 6px">${label}</h3>
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="border:1px solid #e5e7eb;padding:8px;text-align:center">Qty</th>
          <th style="border:1px solid #e5e7eb;padding:8px;text-align:left">Description</th>
          <th style="border:1px solid #e5e7eb;padding:8px;text-align:right">Unit Price</th>
          <th style="border:1px solid #e5e7eb;padding:8px;text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    customerId?: string;
    items?: unknown;
    vatRate?: unknown;
    notes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const customerId = (body.customerId ?? "").trim();
  if (!customerId) {
    return NextResponse.json({ error: "Customer is required." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: QuoteItem[] = [];
  for (const raw of rawItems as Record<string, unknown>[]) {
    const type = raw.type === "service" ? "service" : "item";
    const description = String(raw.description ?? "").trim();
    const qty = Number(raw.qty);
    const price = Number(raw.price);
    if (!description) {
      return NextResponse.json(
        { error: "Every quote line needs a description." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Quantities must be greater than zero." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Prices must be zero or more." },
        { status: 400 }
      );
    }
    items.push({ type, description, qty, price });
  }
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one item or service." },
      { status: 400 }
    );
  }

  let vatRate = Number(body.vatRate ?? DEFAULT_VAT);
  if (!Number.isFinite(vatRate)) vatRate = DEFAULT_VAT;
  vatRate = Math.min(100, Math.max(0, Math.round(vatRate * 100) / 100));

  const notes = String(body.notes ?? "").trim();

  const customers = await readJson<Customer[]>("customers.json");
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (!customer.email.trim()) {
    return NextResponse.json(
      { error: "Customer has no email address." },
      { status: 400 }
    );
  }

  const allQuoteNos = customers.flatMap((c) =>
    (c.quotes ?? []).map((q) => Number(q.quoteNo?.replace(/\D/g, "")) || 0)
  );
  const quoteNo = `QT-${(allQuoteNos.reduce((m, n) => Math.max(m, n), 1000) + 1)}`;

  const subtotal = round2(items.reduce((s, it) => s + it.qty * it.price, 0));
  const vat = vatRate > 0 ? round2((subtotal * vatRate) / 100) : 0;
  const total = round2(subtotal + vat);

  const sender = await resolveSender();
  if (!sender) {
    return NextResponse.json(
      {
        error:
          "You don't have a sender email configured yet. Open the My Profile tab, set your email + SMTP password, save, then try again.",
      },
      { status: 400 }
    );
  }
  const fromEmail = sender.email;
  const config = {
    host: sender.host,
    port: sender.port,
    secure: sender.secure,
    user: sender.email,
    pass: sender.pass,
  };

  interface SiteInfo {
    name?: string;
    contact?: { email?: string; address?: string; phones?: { label: string }[] };
  }
  let site: SiteInfo | null = null;
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = null;
  }
  const siteName = site?.name ?? "TechBucket";
  const siteContact = site?.contact ?? {};
  const phones = (siteContact.phones ?? []).map((p) => p.label).join(" · ");
  const siteLine = `${siteContact.address ?? ""}${siteContact.address ? " · " : ""}${siteContact.email ?? ""}${phones ? ` · ${phones}` : ""}`;

  const subject = `Quotation ${quoteNo} for ${customer.name}`;

  const billTo = [
    customer.name,
    customer.company,
    customer.address,
    customer.phone,
    customer.email,
  ]
    .filter((v): v is string => Boolean(v))
    .map(esc)
    .join("<br>");

  const products = items.filter((i) => i.type === "item");
  const services = items.filter((i) => i.type === "service");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#1f2937">
      <div style="border-bottom:3px solid #f06020;padding:16px 0;margin-bottom:16px">
        <div style="font-size:22px;font-weight:bold">${esc(siteName)} Pvt. Ltd.</div>
        <div style="color:#6b7280;font-size:12px">${siteLine || siteName}</div>
      </div>
      <h1 style="font-size:20px;margin:0 0 4px">QUOTATION</h1>
      <div style="font-size:12px;color:#6b7280;margin-bottom:16px">
        Ref: ${esc(quoteNo)} · Date: ${quoteDate()} · Valid for 30 days
      </div>
      <table style="width:100%;font-size:13px">
        <tr>
          <td style="vertical-align:top">
            <div style="font-weight:bold;font-size:13px">Prepared for:</div>
            <div style="font-size:13px;color:#374151">${billTo}</div>
          </td>
          <td style="vertical-align:top;text-align:right;font-size:13px;color:#374151">
            <div style="font-weight:bold">Prepared by:</div>
            ${esc(user.name)}<br>${esc(fromEmail)}
          </td>
        </tr>
      </table>
      ${products.length ? itemsTable(products, "Products") : ""}
      ${services.length ? itemsTable(services, "Services") : ""}
      <table style="margin:16px 0 0 auto;font-size:13px;border-collapse:collapse">
        <tr>
          <td style="padding:4px 12px">Subtotal</td>
          <td style="padding:4px 12px;text-align:right">${money(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px">VAT (${vatRate}%)</td>
          <td style="padding:4px 12px;text-align:right">${money(vat)}</td>
        </tr>
        <tr style="font-weight:bold;border-top:2px solid #1f2937">
          <td style="padding:6px 12px">Grand Total</td>
          <td style="padding:6px 12px;text-align:right">${money(total)}</td>
        </tr>
      </table>
      ${
        notes
          ? `<div style="margin-top:16px;font-size:12px;color:#374151;border-top:1px solid #e5e7eb;padding-top:12px"><b>Notes:</b><br>${esc(notes).replace(/\n/g, "<br>")}</div>`
          : ""
      }
      <div style="margin-top:24px;font-size:13px;color:#374151;border-top:1px solid #e5e7eb;padding-top:12px">
        Regards,<br>
        <b>${esc(user.name)}</b><br>
        ${esc(fromEmail)}<br>
        ${esc(siteName)} Pvt. Ltd.
      </div>
    </div>`;

  const textLines = [
    `QUOTATION ${quoteNo}`,
    `Date: ${quoteDate()} · Valid for 30 days`,
    "",
    "Prepared for:",
    [
      customer.name,
      customer.company,
      customer.address,
      customer.phone,
      customer.email,
    ]
      .filter(Boolean)
      .join("\n"),
    "",
    ...(products.length
      ? [
          "Products:",
          ...products.map(
            (i) =>
              `- ${i.qty} x ${i.description} — ${money(i.price)} each = ${money(i.qty * i.price)}`
          ),
          "",
        ]
      : []),
    ...(services.length
      ? [
          "Services:",
          ...services.map(
            (i) =>
              `- ${i.qty} x ${i.description} — ${money(i.price)} each = ${money(i.qty * i.price)}`
          ),
          "",
        ]
      : []),
    `Subtotal: ${money(subtotal)}`,
    `VAT (${vatRate}%): ${money(vat)}`,
    `Grand Total: ${money(total)}`,
    "",
    notes ? `Notes:\n${notes}\n` : "",
    "Regards,",
    user.name,
    fromEmail,
    siteName,
    siteLine,
  ].filter((l) => l !== "");

  const result = await sendMailWith(config, {
    fromName: user.name,
    to: customer.email,
    subject,
    text: textLines.join("\n"),
    html,
  });

  const quote: Quote = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    quoteNo,
    to: customer.email,
    subject,
    items,
    vatRate,
    subtotal,
    vat,
    total,
    notes,
    sentBy: user.name,
    sentAt: new Date().toISOString(),
    status: result.ok ? "sent" : "failed",
  };
  customer.quotes = customer.quotes ?? [];
  customer.quotes.push(quote);
  await writeJson("customers.json", customers);

  return NextResponse.json(
    result.ok
      ? { ok: true, quote }
      : {
          ok: false,
          error:
            result.error || "The email could not be sent. Check your SMTP settings.",
        },
    { status: result.ok ? 200 : 500 }
  );
}
