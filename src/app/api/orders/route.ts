import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { appendOrder, newOrderId, type OrderItem } from "@/lib/orders";
import {
  clampInt,
  clampNumber,
  isValidEmail,
  isValidPhone,
  MAX_DESCRIPTION,
  MAX_EMAIL,
  MAX_ITEMS,
  MAX_MESSAGE,
  MAX_NAME,
  MAX_PRICE,
  MAX_QTY,
} from "@/lib/validation";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  if (isRateLimited(`orders:${clientIp(req)}`, 10, 60 * 1000)) {
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
  const channel = str(body.channel) === "whatsapp" ? "whatsapp" : "email";

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

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: "Order must contain between 1 and 50 products." },
      { status: 400 }
    );
  }

  const items: OrderItem[] = [];
  for (const it of rawItems) {
    const row = (it ?? {}) as Record<string, unknown>;
    const itemName = str(row.name);
    if (!itemName) {
      return NextResponse.json(
        { error: "Every order line needs a product name." },
        { status: 400 }
      );
    }
    items.push({
      name: itemName.slice(0, MAX_DESCRIPTION),
      qty: clampInt(row.qty, 1, 1, MAX_QTY),
      price: clampNumber(row.price, 0, 0, MAX_PRICE),
      total: 0,
    });
  }
  for (const it of items) {
    it.total = it.price * it.qty;
  }

  const computedTotal = items.reduce((s, i) => s + i.total, 0);
  const subtotal = clampNumber(body.subtotal, computedTotal, 0, computedTotal);
  const total = subtotal > 0 ? subtotal : computedTotal;

  await appendOrder({
    id: newOrderId(),
    type: "order",
    channel,
    items,
    subtotal: total,
    customerName: name,
    email,
    phone: phone || undefined,
    note: note || undefined,
    createdAt: new Date().toISOString(),
  });

  const orderLines = items
    .map((it) => `- ${it.name} x${it.qty} — Rs. ${it.total}`)
    .join("\n");

  const adminTo =
    process.env.QUOTES_TO || process.env.SUPPORT_TO || "info@techbucket.com.np";

  const adminSent = await sendMail({
    to: adminTo,
    subject: `New order request (${channel}) — ${name}`,
    text: [
      `New product order request`,
      `Channel: ${channel}`,
      "",
      orderLines,
      "",
      `Subtotal: Rs. ${total}`,
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : "",
      note ? `Notes:\n${note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <h2>New product order request</h2>
      <p>Channel: <strong>${esc(channel)}</strong></p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        <tr><th align="left" style="border:1px solid #ddd;padding:8px">Product</th><th align="left" style="border:1px solid #ddd;padding:8px">Qty</th><th align="left" style="border:1px solid #ddd;padding:8px">Amount</th></tr>
        ${items
          .map(
            (it) =>
              `<tr><td style="border:1px solid #ddd;padding:8px">${esc(it.name)}</td><td style="border:1px solid #ddd;padding:8px">${it.qty}</td><td style="border:1px solid #ddd;padding:8px">Rs. ${it.total}</td></tr>`
          )
          .join("")}
      </table>
      <p><strong>Subtotal:</strong> Rs. ${total}</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${[
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
      <p style="color:#888;font-size:12px">View and manage this order in the TechBucket admin panel (Orders & Requests).</p>
    `,
  });

  const customerSent = await sendMail({
    to: email,
    subject: "Your order request has been received",
    text: [
      `Hello ${name},`,
      "",
      `Thank you for your order request (via ${channel}).`,
      "",
      orderLines,
      "",
      `Subtotal: Rs. ${total}`,
      "",
      `We have received your order and will confirm availability, delivery and installation with you shortly.`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <h2>Order request received</h2>
      <p>Hello ${esc(name)},</p>
      <p>Thank you for your order request (via <strong>${esc(channel)}</strong>).</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${items
          .map(
            (it) =>
              `<tr><td style="border:1px solid #ddd;padding:8px">${esc(it.name)} x${it.qty}</td><td style="border:1px solid #ddd;padding:8px">Rs. ${it.total}</td></tr>`
          )
          .join("")}
      </table>
      <p><strong>Subtotal:</strong> Rs. ${total}</p>
      <p>We have received your order and will confirm availability, delivery and installation with you shortly.</p>
    `,
  });

  return NextResponse.json({
    ok: true,
    emailSent: Boolean(adminSent || customerSent),
  });
}
