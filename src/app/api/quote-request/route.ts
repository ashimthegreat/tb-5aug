import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { appendOrder, newOrderId, type OrderItem } from "@/lib/orders";
import { getUsers } from "@/lib/admin";
import {
  clampInt,
  clampNumber,
  isValidEmail,
  isValidPhone,
  MAX_DESCRIPTION,
  MAX_EMAIL,
  MAX_MESSAGE,
  MAX_NAME,
  MAX_PRICE,
  MAX_QTY,
} from "@/lib/validation";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { findCustomer, listCustomers } from "@/lib/customers";
import { resolveCatalogPrice } from "@/lib/pricing";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function adminRecipients(): Promise<string[]> {
  const users = await getUsers();
  const addresses = users
    .filter(
      (u) =>
        (u.role === "superadmin" || u.role === "sales" || u.role === "saleshead") &&
        u.active &&
        (u.email ?? "").trim().length > 0
    )
    .map((u) => u.email.trim());
  const fallback =
    process.env.QUOTES_TO || process.env.SUPPORT_TO || "info@techbucket.com.np";
  const unique = [...new Set(addresses)];
  return unique.length > 0 ? unique : [fallback];
}

export async function POST(req: NextRequest) {
  if (isRateLimited(`quote:${clientIp(req)}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(body.name).slice(0, MAX_NAME);
  const email = str(body.email).toLowerCase().slice(0, MAX_EMAIL);
  const phone = str(body.phone).slice(0, 30);
  const note = str(body.note).slice(0, MAX_MESSAGE);
  const productName = str(body.productName).slice(0, MAX_DESCRIPTION);
  const qty = clampInt(body.qty, 1, 1, MAX_QTY);
  const price = clampNumber(body.price, 0, 0, MAX_PRICE);

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 }
    );
  }
  if (phone && !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Please provide a valid phone number." },
      { status: 400 }
    );
  }
  if (!productName) {
    return NextResponse.json({ error: "Product is required." }, { status: 400 });
  }

  const unitPrice =
    Number.isFinite(price) && price > 0
      ? await resolveCatalogPrice(productName, price)
      : 0;
  const item: OrderItem = {
    name: productName,
    qty,
    price: unitPrice,
    total: unitPrice * qty,
  };

  await appendOrder({
    id: newOrderId(),
    type: "quote-request",
    items: [item],
    subtotal: item.total,
    customerName: name,
    email,
    phone: phone || undefined,
    note: note || undefined,
    createdAt: new Date().toISOString(),
    customerId: findCustomer(await listCustomers(), phone, email)?.id,
  });

  const adminTo = (await adminRecipients()).join(", ");

  const adminSent = await sendMail({
    to: adminTo,
    subject: `Quote request: ${productName} x${qty} — ${name}`,
    text: [
      `New quote request`,
      `Product: ${productName}`,
      `Quantity: ${qty}`,
      unitPrice > 0 ? `Unit price: Rs. ${unitPrice}` : "",
      unitPrice > 0 ? `Total: Rs. ${item.total}` : "",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : "",
      note ? `Notes:\n${note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <h2>New quote request</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${[
          ["Product", productName],
          ["Quantity", String(qty)],
          ...(unitPrice > 0
            ? [
                ["Unit price", `Rs. ${unitPrice}`],
                ["Total", `Rs. ${item.total}`],
              ]
            : []),
          ["Name", name],
          ["Email", email],
          ["Phone", phone],
        ]
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold">${esc(k)}</td><td style="border:1px solid #ddd;padding:8px">${esc(v)}</td></tr>`
          )
          .join("")}
      </table>
      ${note ? `<h3>Notes</h3><p style="white-space:pre-wrap;font-family:Arial,sans-serif">${esc(note)}</p>` : ""}
      <p style="color:#888;font-size:12px">View and manage this request in the TechBucket admin panel (Orders & Requests).</p>
    `,
  });

  const customerSent = await sendMail({
    to: email,
    subject: `Your quote request for ${productName}`,
    text: [
      `Hello ${name},`,
      "",
      `Thank you for requesting a quote for:`,
      `- ${productName} x${qty}`,
      "",
      `We have received your request and will get back to you shortly with pricing and availability.`,
      phone ? `Phone: ${phone}` : "",
      note ? `Your notes:\n${note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <h2>Quote request received</h2>
      <p>Hello ${esc(name)},</p>
      <p>Thank you for requesting a quote for:</p>
      <ul>
        <li>${esc(productName)} x${qty}</li>
      </ul>
      <p>We have received your request and will get back to you shortly with pricing and availability.</p>
    `,
  });

  return NextResponse.json({
    ok: true,
    emailSent: Boolean(adminSent || customerSent),
  });
}
