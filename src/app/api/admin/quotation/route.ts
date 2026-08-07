import { NextRequest } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import {
  renderQuotationHtml,
  quoteDate,
  signatureName,
  type QuotationLine,
  type QuotationParty,
} from "@/lib/quotation";
import { publicUrlAsDataUri } from "@/lib/embed";
import { stampDataUrl } from "@/lib/stamp";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales"];

interface Quote {
  id: string;
  quoteNo: string;
  to: string;
  subject: string;
  items: QuotationLine[];
  vatRate: number;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  vat: number;
  total: number;
  notes: string;
  specs?: string;
  terms?: string;
  validUntil?: string;
  sentBy: string;
  signatory?: string;
  designation?: string;
  signature?: string;
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

interface SiteInfo {
  name?: string;
  contact?: {
    email?: string;
    address?: string;
    phones?: { label: string }[];
    vatNo?: string;
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!id) {
    return new Response("Missing quote id", { status: 400 });
  }
  const letterhead = req.nextUrl.searchParams.get("letterhead") !== "0";

  const customers = await readJson<Customer[]>("customers.json");
  let customer: Customer | undefined;
  let quote: Quote | undefined;
  for (const c of customers) {
    const q = (c.quotes ?? []).find((x) => x.id === id);
    if (q) {
      customer = c;
      quote = q;
      break;
    }
  }
  if (!quote || !customer) {
    return new Response("Quote not found", { status: 404 });
  }

  let site: SiteInfo = {};
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = {};
  }
  const contact = site.contact ?? {};
  const company = {
    name: site.name ?? "TechBucket",
    email: contact.email ?? "",
    address: contact.address ?? "",
    phones: (contact.phones ?? []).map((p) => p.label),
    vatNo: contact.vatNo,
  };

  const billTo: QuotationParty = {
    name: customer.name,
    email: customer.email,
    company: customer.company,
    address: customer.address,
    phone: customer.phone,
  };
  const preparedBy: QuotationParty = {
    name:
      quote.signatory?.trim() ||
      quote.sentBy ||
      signatureName(user.signatory, user.name),
    email: company.email,
    title: quote.designation || user.designation || undefined,
    signature: publicUrlAsDataUri(
      quote.signature || user.signature || undefined
    ),
    stamp: await stampDataUrl(),
  };

  const html = renderQuotationHtml({
    origin: req.nextUrl.origin,
    company,
    quote: {
      quoteNo: quote.quoteNo,
      date: quoteDate(quote.sentAt),
      items: quote.items,
      vatRate: quote.vatRate,
      discountPercent: quote.discountPercent ?? 0,
      discountAmount: quote.discountAmount ?? 0,
      subtotal: quote.subtotal,
      vat: quote.vat,
      total: quote.total,
      notes: quote.notes,
      specs: quote.specs,
      terms: quote.terms,
      validUntil: quote.validUntil,
    },
    preparedBy,
    billTo,
    letterhead,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
