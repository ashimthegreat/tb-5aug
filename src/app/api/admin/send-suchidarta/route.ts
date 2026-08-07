import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";
import { resolveSender, sendMailWith } from "@/lib/mail";
import {
  letterContactLine,
  renderSuchidartaHtml,
  SUCHIDARTA_SUBJECT,
} from "@/lib/suchidarta";
import { signatureName } from "@/lib/quotation";
import { publicAsset } from "@/lib/embed";
import { stampPngBuffer } from "@/lib/stamp";

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
  signatory?: string;
  contact?: {
    email?: string;
    address?: string;
    phones?: { label: string }[];
    vatNo?: string;
  };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    customerId?: string;
    recipient?: unknown;
    body?: unknown;
    signatory?: unknown;
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

  const recipient = String(body.recipient ?? "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "Add the recipient address for this letter." },
      { status: 400 }
    );
  }
  const letterBody = String(body.body ?? "").trim();
  if (!letterBody) {
    return NextResponse.json(
      { error: "Letter body cannot be empty." },
      { status: 400 }
    );
  }
  const signatory = signatureName(
    String(body.signatory ?? ""),
    signatureName(user.signatory, user.name)
  );

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

  let site: SiteInfo | null = null;
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = null;
  }
  const contact = site?.contact ?? {};
  const companyName = site?.name ?? "TechBucket";
  const company = {
    name: companyName,
    email: contact.email ?? "",
    address: contact.address ?? "",
    phones: (contact.phones ?? []).map((p) => p.label),
    vatNo: contact.vatNo ?? "",
  };
  const contactLine = letterContactLine(company.phones);
  const tagline = [
    company.address,
    [company.email, ...company.phones].filter(Boolean).join(" · "),
    company.vatNo ? `PAN/VAT: ${company.vatNo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const attachments: {
    filename: string;
    content: Buffer;
    cid: string;
    disposition: "inline";
  }[] = [];
  const logoAsset = publicAsset("/images/logo.png");
  if (logoAsset) {
    attachments.push({ ...logoAsset, cid: "logo", disposition: "inline" });
  }
  const sigAsset = publicAsset(user.signature);
  if (sigAsset) {
    attachments.push({ ...sigAsset, cid: "signature", disposition: "inline" });
  }
  const stampBuf = await stampPngBuffer();
  if (stampBuf) {
    attachments.push({
      filename: "stamp.png",
      content: stampBuf,
      cid: "stamp",
      disposition: "inline",
    });
  }

  const html = renderSuchidartaHtml({
    origin: new URL(req.url).origin,
    data: {
      recipient,
      body: letterBody,
      signatory,
      designation: user.designation || undefined,
      signatureSrc: sigAsset ? "cid:signature" : undefined,
      stampSrc: stampBuf ? "cid:stamp" : undefined,
      companyName,
      contactLine,
      tagline,
    },
    letterhead: true,
    variant: "email",
    logoSrc: logoAsset ? "cid:logo" : undefined,
  });

  const subject = `${SUCHIDARTA_SUBJECT.replace(/^विषय:\s*/, "")} – ${customer.name}`;

  const textLines = [
    `मिति:`,
    "",
    "श्री,",
    recipient,
    "",
    SUCHIDARTA_SUBJECT,
    "",
    "महोदय,",
    "",
    letterBody,
    "",
    "भवदीय,",
    "",
    "दस्तखत: ..............",
    `नाम: ${signatory}`,
    user.designation ? `पद: ${user.designation}` : "पद: ..............",
    `कम्पनीको नाम: ${companyName}`,
    "",
    `सम्पर्क: ${contactLine}`,
  ];

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

  const result = await sendMailWith(
    {
      host: sender.host,
      port: sender.port,
      secure: sender.secure,
      user: sender.email,
      pass: sender.pass,
    },
    {
      fromName: companyName,
      to: customer.email,
      subject,
      text: textLines.filter((l) => l !== "").join("\n"),
      html,
      attachments,
    }
  );

  const record: SuchidartaRecord = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    recipient,
    subject,
    body: letterBody,
    signatory,
    designation: user.designation || undefined,
    signature: user.signature || undefined,
    sentTo: customer.email,
    sentBy: user.name,
    sentAt: new Date().toISOString(),
    status: result.ok ? "sent" : "failed",
  };
  customer.suchidarta = customer.suchidarta ?? [];
  customer.suchidarta.push(record);
  await writeJson("customers.json", customers);

  return NextResponse.json(
    result.ok
      ? { ok: true, suchidarta: record }
      : {
          ok: false,
          error:
            result.error || "The email could not be sent. Check your SMTP settings.",
        },
    { status: result.ok ? 200 : 500 }
  );
}
