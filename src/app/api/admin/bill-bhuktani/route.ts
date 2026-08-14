import { NextRequest } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { renderBillBhuktaniHtml, type BankDetails } from "@/lib/billBhuktani";
import { signatureName } from "@/lib/quotation";
import { publicUrlAsDataUri } from "@/lib/embed";
import { stampDataUrl } from "@/lib/stamp";
import { listFulfillment } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales", "saleshead"];

interface BillBhuktaniRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  signatory: string;
  designation?: string;
  signature?: string;
  date?: string;
  bank: BankDetails;
  sentTo: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface SiteInfo {
  name?: string;
  contact?: {
    email?: string;
    address?: string;
    phones?: { label: string }[];
    vatNo?: string;
  };
  bank?: BankDetails;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!id) {
    return new Response("Missing letter id", { status: 400 });
  }
  const letterhead = req.nextUrl.searchParams.get("letterhead") !== "0";

  const orders = await listFulfillment();
  let record: BillBhuktaniRecord | undefined;
  for (const o of orders) {
    const r = (o.billBhuktani ?? []).find((x) => x.id === id);
    if (r) {
      record = r;
      break;
    }
  }
  if (!record) {
    return new Response("Letter not found", { status: 404 });
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
  const contactLine = [company.email, ...company.phones]
    .filter(Boolean)
    .join(" · ");
  const tagline = [
    company.address,
    [company.email, ...company.phones].filter(Boolean).join(" · "),
    company.vatNo ? `PAN/VAT: ${company.vatNo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const html = renderBillBhuktaniHtml({
    origin: req.nextUrl.origin,
    data: {
      recipient: record.recipient,
      subject: record.subject,
      body: record.body,
      signatory:
        record.signatory.trim() || signatureName(user.signatory, user.name),
      designation: record.designation || user.designation || undefined,
      signatureSrc: publicUrlAsDataUri(
        record.signature || user.signature || undefined
      ),
      stampSrc: await stampDataUrl(),
      companyName: company.name,
      contactLine,
      tagline,
      date: record.date,
      bank: record.bank,
    },
    letterhead,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
