import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getUsers } from "@/lib/admin";
import { resolveSender, sendMailWith } from "@/lib/mail";
import { listFulfillment } from "@/lib/fulfillment";
import { paidTotal, paymentStatus, daysPastDue } from "@/lib/payment";
import type { FulfillmentOrder } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function money(n: number): string {
  return `Rs. ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function outstanding(o: FulfillmentOrder): number {
  return Math.round((o.total - paidTotal(o)) * 100) / 100;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRON_SECRET must be set in production.");
    }
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const authorized =
    bearer.length > 0 &&
    safeEqual(Buffer.from(bearer), Buffer.from(cronSecret));
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await listFulfillment();
  const overdue = orders
    .filter(
      (o) =>
        o.billNo &&
        o.status !== "cancelled" &&
        paymentStatus(o) === "overdue"
    )
    .sort((a, b) => daysPastDue(b) - daysPastDue(a));

  if (overdue.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, overdue: [] });
  }

  const sender = await resolveSender();
  if (!sender) {
    return NextResponse.json(
      { ok: false, error: "SMTP sender is not configured." },
      { status: 400 }
    );
  }
  const config = {
    host: sender.host,
    port: sender.port,
    secure: sender.secure,
    user: sender.email,
    pass: sender.pass,
  };

  const users = await getUsers();
  const recipients = users
    .filter(
      (u) =>
        (u.role === "superadmin" || u.role === "sales" || u.role === "saleshead") &&
        u.active &&
        (u.email ?? "").trim().length > 0
    )
    .map((u) => u.email.trim());

  let sentCount = 0;
  if (recipients.length > 0) {
    const grandTotal = overdue.reduce((s, o) => s + outstanding(o), 0);
    const lines = overdue
      .map(
        (o) =>
          `- ${o.orderNo} · ${o.customerName} · Bill ${o.billNo} · ${money(o.total)} · outstanding ${money(outstanding(o))} · due ${o.paymentDueDate} (${daysPastDue(o)} days)`
      )
      .join("\n");
    const subject = `Overdue payments — ${overdue.length} bill${overdue.length === 1 ? "" : "s"}`;
    const text = `The following ${overdue.length} bill(s) are overdue as of ${new Date().toLocaleDateString()}.\n\n${lines}\n\nTotal outstanding: ${money(grandTotal)}\n\nPlease follow up with customers to arrange payment. Update payment status in the Fulfillment tab.`;

    for (const to of recipients) {
      const result = await sendMailWith(config, {
        fromName: "TechBucket Billing",
        to,
        subject,
        text,
      });
      if (result.ok) sentCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    sent: sentCount,
    overdue: overdue.length,
  });
}
