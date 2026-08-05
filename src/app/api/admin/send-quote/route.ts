import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";
import { resolveSender, sendMailWith } from "@/lib/mail";
import {
  money,
  quoteDate,
  renderQuotationHtml,
  round2,
  type QuotationParty,
} from "@/lib/quotation";

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
  discountPercent?: number;
  discountAmount?: number;
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
    discountId?: string;
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

  let discountPercent = 0;
  const discountId = (body.discountId ?? "").trim();
  if (discountId) {
    const discounts = await readJson<
      { id: string; name: string; percent: number; active?: boolean }[]
    >("discounts.json");
    const scheme = discounts.find((d) => d.id === discountId);
    if (!scheme || scheme.active === false) {
      return NextResponse.json(
        { error: "Selected discount scheme is not available." },
        { status: 400 }
      );
    }
    discountPercent = Math.min(
      100,
      Math.max(0, Number(scheme.percent) || 0)
    );
  }
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const net = round2(subtotal - discountAmount);
  const vat = vatRate > 0 ? round2((net * vatRate) / 100) : 0;
  const total = round2(net + vat);

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
    contact?: {
      email?: string;
      address?: string;
      phones?: { label: string }[];
      vatNo?: string;
    };
  }
  let site: SiteInfo | null = null;
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = null;
  }
  const contact = site?.contact ?? {};
  const siteName = site?.name ?? "TechBucket";
  const company = {
    name: siteName,
    email: contact.email ?? "",
    address: contact.address ?? "",
    phones: (contact.phones ?? []).map((p) => p.label),
    vatNo: contact.vatNo ?? "",
  };
  const siteLine = [company.address, company.email, ...company.phones]
    .filter(Boolean)
    .join(" · ");

  const subject = `Quotation ${quoteNo} for ${customer.name}`;

  const products = items.filter((i) => i.type === "item");
  const services = items.filter((i) => i.type === "service");

  const billTo: QuotationParty = {
    name: customer.name,
    email: customer.email,
    company: customer.company,
    address: customer.address,
    phone: customer.phone,
  };
  const preparedBy: QuotationParty = { name: user.name, email: fromEmail };

  const html = renderQuotationHtml({
    origin: new URL(req.url).origin,
    company,
    quote: {
      quoteNo,
      date: quoteDate(),
      items,
      vatRate,
      subtotal,
      discountPercent,
      discountAmount,
      vat,
      total,
      notes,
    },
    preparedBy,
    billTo,
    letterhead: true,
    variant: "email",
  });

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
    ...(discountPercent > 0
      ? [
          `Discount (${discountPercent}%): −${money(discountAmount)}`,
          `After discount: ${money(net)}`,
        ]
      : []),
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
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    discountAmount: discountPercent > 0 ? discountAmount : undefined,
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
