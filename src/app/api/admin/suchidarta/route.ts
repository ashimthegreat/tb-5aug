import { NextRequest } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { letterContactLine, renderSuchidartaHtml } from "@/lib/suchidarta";
import { signatureName } from "@/lib/quotation";
import { publicUrlAsDataUri } from "@/lib/embed";
import { stampDataUrl } from "@/lib/stamp";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales"];

interface SuchidartaRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  signatory: string;
  designation?: string;
  signature?: string;
  sentTo: string;
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
  suchidarta?: SuchidartaRecord[];
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
    return new Response("Missing letter id", { status: 400 });
  }
  const letterhead = req.nextUrl.searchParams.get("letterhead") !== "0";

  const customers = await readJson<Customer[]>("customers.json");
  let record: SuchidartaRecord | undefined;
  for (const c of customers) {
    const r = (c.suchidarta ?? []).find((x) => x.id === id);
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
  const tagline = [
    company.address,
    [company.email, ...company.phones].filter(Boolean).join(" · "),
    company.vatNo ? `PAN/VAT: ${company.vatNo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const html = renderSuchidartaHtml({
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
      contactLine: letterContactLine(company.phones),
      tagline,
    },
    letterhead,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
