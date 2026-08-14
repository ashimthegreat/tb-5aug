import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";
import { resolveSender, sendMailWith } from "@/lib/mail";
import {
  BILL_BHUKTANI_SUBJECT,
  renderBillBhuktaniHtml,
  type BankDetails,
} from "@/lib/billBhuktani";
import { bsDateNepali, signatureName } from "@/lib/quotation";
import { publicAsset } from "@/lib/embed";
import { stampPngBuffer } from "@/lib/stamp";
import {
  getFulfillment,
  listFulfillment,
  saveFulfillment,
  type FulfillmentOrder,
} from "@/lib/fulfillment";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales", "saleshead"];

interface SiteInfo {
  name?: string;
  signatory?: string;
  contact?: {
    email?: string;
    address?: string;
    phones?: { label: string }[];
    vatNo?: string;
  };
  bank?: BankDetails;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    orderId?: string;
    recipient?: unknown;
    subject?: unknown;
    body?: unknown;
    signatory?: unknown;
    date?: unknown;
    bank?: Partial<BankDetails>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderId = (body.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "Order is required." },
      { status: 400 }
    );
  }

  const order = await getFulfillment(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.billNo) {
    return NextResponse.json(
      { error: "This order has not been billed yet. Create a bill first." },
      { status: 400 }
    );
  }
  if (!order.customerEmail.trim()) {
    return NextResponse.json(
      { error: "Customer has no email address." },
      { status: 400 }
    );
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
  const letterDate = String(body.date ?? "").trim() || bsDateNepali();

  let site: SiteInfo | null = null;
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = null;
  }
  const contact = site?.contact ?? {};
  const companyName = site?.name ?? "TechBucket";
  const bank: BankDetails = {
    accountName: body.bank?.accountName?.trim() || site?.bank?.accountName || "",
    accountNumber:
      body.bank?.accountNumber?.trim() || site?.bank?.accountNumber || "",
    bankName: body.bank?.bankName?.trim() || site?.bank?.bankName || "",
    branch: body.bank?.branch?.trim() || site?.bank?.branch || "",
  };
  const contactLine = [
    contact.email,
    ...(contact.phones ?? []).map((p) => p.label),
  ]
    .filter(Boolean)
    .join(" · ");
  const tagline = [
    contact.address,
    [contact.email, ...(contact.phones ?? []).map((p) => p.label)]
      .filter(Boolean)
      .join(" · "),
    contact.vatNo ? `PAN/VAT: ${contact.vatNo}` : "",
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

  const html = renderBillBhuktaniHtml({
    origin: new URL(req.url).origin,
    data: {
      recipient,
      subject: body.subject ? String(body.subject).trim() : undefined,
      body: letterBody,
      signatory,
      designation: user.designation || undefined,
      signatureSrc: sigAsset ? "cid:signature" : undefined,
      stampSrc: stampBuf ? "cid:stamp" : undefined,
      companyName,
      contactLine,
      tagline,
      date: letterDate,
      bank,
    },
    letterhead: true,
    variant: "email",
    logoSrc: logoAsset ? "cid:logo" : undefined,
  });

  const subject = `${BILL_BHUKTANI_SUBJECT.replace(/^विषय:\s*/, "")} – ${order.customerName} (Bill ${order.billNo})`;

  const textLines = [
    `मिति:${letterDate}`,
    "",
    "श्री,",
    recipient,
    "",
    BILL_BHUKTANI_SUBJECT,
    "",
    "महोदय,",
    "",
    letterBody,
    "",
    "कम्पनीको खाताको विवरण:",
    `Company Name: ${bank.accountName}`,
    `Account Number: ${bank.accountNumber}`,
    `Bank: ${bank.bankName}`,
    bank.branch ? `Branch: ${bank.branch}` : "",
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
      to: order.customerEmail,
      subject,
      text: textLines.filter((l) => l !== "").join("\n"),
      html,
      attachments,
    }
  );

  const record = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    recipient,
    subject,
    body: letterBody,
    signatory,
    designation: user.designation || undefined,
    signature: user.signature || undefined,
    date: letterDate,
    bank,
    sentTo: order.customerEmail,
    sentBy: user.name,
    sentAt: new Date().toISOString(),
    status: (result.ok ? "sent" : "failed") as "sent" | "failed",
  };

  const orders = await listFulfillment();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    const target: FulfillmentOrder = orders[idx];
    target.billBhuktani = target.billBhuktani ?? [];
    target.billBhuktani.push(record);
    target.updatedAt = new Date().toISOString();
    await saveFulfillment(orders);
  }

  return NextResponse.json(
    result.ok
      ? { ok: true, billBhuktani: record }
      : {
          ok: false,
          error:
            result.error || "The email could not be sent. Check your SMTP settings.",
        },
    { status: result.ok ? 200 : 500 }
  );
}
