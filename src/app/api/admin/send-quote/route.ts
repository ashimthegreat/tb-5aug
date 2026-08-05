import { NextRequest, NextResponse } from "next/server";
import { decryptSecret, getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";
import { sendMailWith, smtpDefaultsFor } from "@/lib/mail";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales"];

interface Quote {
  id: string;
  to: string;
  subject: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface Customer {
  id: string;
  name: string;
  email: string;
  quotes?: Quote[];
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { customerId?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const customerId = (body.customerId ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.body ?? "").trim();
  if (!customerId || !subject || !message) {
    return NextResponse.json(
      { error: "Customer, subject and message are required." },
      { status: 400 }
    );
  }

  const customers = await readJson<Customer[]>("customers.json");
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const fromEmail = (user.email ?? "").trim().toLowerCase();
  if (!fromEmail || !user.smtpPassEnc) {
    return NextResponse.json(
      {
        error:
          "You don't have a sender email configured yet. Open the My Profile tab, set your email + SMTP password, save, then try again.",
      },
      { status: 400 }
    );
  }

  let pass: string;
  try {
    pass = decryptSecret(user.smtpPassEnc);
  } catch {
    return NextResponse.json(
      {
        error:
          "Your stored SMTP password could not be decrypted. Re-enter it in the Users tab and save.",
      },
      { status: 400 }
    );
  }

  const defaults = smtpDefaultsFor(fromEmail);
  const port = user.smtpPort ?? defaults.port;
  const config = {
    host: user.smtpHost || defaults.host,
    port,
    secure: user.smtpPort ? port === 465 : defaults.secure,
    user: fromEmail,
    pass,
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
  const phones = (site?.contact?.phones ?? []).map((p) => p.label).join(" · ");
  const footer = site
    ? `\n\n---\n${site.name ?? "TechBucket"} Pvt. Ltd.\n${site.contact?.address ?? ""}\n${site.contact?.email ?? ""}${phones ? ` · ${phones}` : ""}`
    : "";

  const result = await sendMailWith(config, {
    fromName: user.name,
    to: customer.email,
    subject,
    text: `${message}${footer}`,
  });

  const quote: Quote = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    to: customer.email,
    subject,
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
