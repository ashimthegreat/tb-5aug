import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { sendMail } from "@/lib/mail";
import {
  isValidEmail,
  isValidPhone,
  MAX_DESCRIPTION,
  MAX_EMAIL,
  MAX_MESSAGE,
  MAX_NAME,
} from "@/lib/validation";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

const TICKETS_FILE = path.join(process.cwd(), "content", "tickets.json");

export interface SupportTicket {
  id: string;
  ticketNo: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  priority: string;
  product: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  replies: { id: string; author: string; text: string; createdAt: string }[];
  createdAt: string;
}

const CATEGORIES = ["Technical", "Billing", "Product Enquiry", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

async function readTickets(): Promise<SupportTicket[]> {
  try {
    const raw = await fs.readFile(TICKETS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  if (isRateLimited(`support:${clientIp(req)}`, 10, 60 * 1000)) {
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
  const subject = str(body.subject).slice(0, MAX_DESCRIPTION);
  const message = str(body.message).slice(0, MAX_MESSAGE);
  const category = str(body.category) || "Other";
  const priority = str(body.priority) || "Medium";
  const phone = str(body.phone).slice(0, 30);
  const product = str(body.product).slice(0, MAX_DESCRIPTION);

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: "Name, email, subject and message are required." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (phone && !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Please provide a valid phone number." },
      { status: 400 }
    );
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Please choose a valid category." }, { status: 400 });
  }
  if (!PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: "Please choose a valid priority." }, { status: 400 });
  }

  const tickets = await readTickets();
  const nextNumber = tickets.reduce(
    (max, t) => Math.max(max, Number(t.ticketNo.replace(/\D/g, "")) || 0),
    1000
  ) + 1;
  const ticketNo = `TB-${nextNumber}`;

  const ticket: SupportTicket = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ticketNo,
    name,
    email,
    phone,
    category,
    priority,
    product,
    subject,
    message,
    status: "open",
    replies: [],
    createdAt: new Date().toISOString(),
  };

  tickets.push(ticket);
  await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");

  const lines = [
    `Ticket: ${ticketNo}`,
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : "",
    `Category: ${category}`,
    `Priority: ${priority}`,
    product ? `Related product/order: ${product}` : "",
    `Status: Open`,
    "",
    message,
  ].filter(Boolean);

  const emailSent = await sendMail({
    to: process.env.SUPPORT_TO || "support@techbucket.com.np",
    subject: `[${ticketNo}] ${subject} (${priority})`,
    text: lines.join("\n"),
    html: `
      <h2>New support ticket ${ticketNo}</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${[
          ["Name", name],
          ["Email", email],
          ["Phone", phone],
          ["Category", category],
          ["Priority", priority],
          ["Related product/order", product],
          ["Status", "Open"],
        ]
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold">${esc(k)}</td><td style="border:1px solid #ddd;padding:8px">${esc(v)}</td></tr>`
          )
          .join("")}
      </table>
      <h3>Message</h3>
      <p style="white-space:pre-wrap;font-family:Arial,sans-serif">${esc(message)}</p>
      <p style="color:#888;font-size:12px">View and manage this ticket in the TechBucket admin panel.</p>
    `,
  });

  return NextResponse.json({ ok: true, ticketNo, emailSent });
}
