import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUsers } from "@/lib/admin";
import { resolveSender, sendMailWith } from "@/lib/mail";
import { listFulfillment } from "@/lib/fulfillment";
import { paidTotal, paymentStatus, daysPastDue } from "@/lib/payment";
import type { FulfillmentOrder } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

function money(n: number): string {
  return `Rs. ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function outstanding(o: FulfillmentOrder): number {
  return Math.round((o.total - paidTotal(o)) * 100) / 100;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mode = (req.nextUrl.searchParams.get("mode") ?? "internal") as
    | "internal"
    | "customer"
    | "both";

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
    return NextResponse.json({ ok: true, sent: 0, dunned: 0, overdue: [] });
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

  let sentCount = 0;
  let dunnedCount = 0;

  if (mode === "internal" || mode === "both") {
    const users = await getUsers();
    const recipients = users
      .filter(
        (u) =>
          (u.role === "superadmin" || u.role === "sales") &&
          u.active &&
          (u.email ?? "").trim().length > 0
      )
      .map((u) => u.email.trim());
    if (recipients.length > 0) {
      const grandTotal = totalOutstanding(overdue);
      const lines = overdue
        .map(
          (o) =>
            `- ${o.orderNo} · ${o.customerName} · Bill ${o.billNo} · ${money(o.total)} · outstanding ${money(outstanding(o))} · due ${o.paymentDueDate} (${daysPastDue(o)} days)`
        )
        .join("\n");
      const tableRows = overdue
        .map(
          (o) =>
            `<tr><td style="border:1px solid #ddd;padding:8px">${esc(o.orderNo)}</td><td style="border:1px solid #ddd;padding:8px">${esc(o.billNo ?? "")}</td><td style="border:1px solid #ddd;padding:8px">${esc(o.customerName)}</td><td style="border:1px solid #ddd;padding:8px;text-align:right">${money(o.total)}</td><td style="border:1px solid #ddd;padding:8px;text-align:right">${daysPastDue(o)}</td></tr>`
        )
        .join("");
      const subject = `Overdue payments — ${overdue.length} bill${overdue.length === 1 ? "" : "s"}`;
      const text = `The following ${overdue.length} bill(s) are overdue as of ${new Date().toLocaleDateString()}.\n\n${lines}\n\nTotal outstanding: ${money(grandTotal)}\n\nPlease follow up with customers to arrange payment. Update payment status in the Fulfillment tab.`;
      const html = `<h2>${esc(subject)}</h2><p>The following ${overdue.length} bill(s) are overdue as of ${esc(new Date().toLocaleDateString())}.</p><table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px"><tr><th align="left" style="border:1px solid #ddd;padding:8px">Order</th><th align="left" style="border:1px solid #ddd;padding:8px">Bill</th><th align="left" style="border:1px solid #ddd;padding:8px">Customer</th><th align="right" style="border:1px solid #ddd;padding:8px">Total</th><th align="right" style="border:1px solid #ddd;padding:8px">Days overdue</th></tr>${tableRows}</table><p><strong>Total outstanding:</strong> ${money(grandTotal)}</p><p style="color:#555">Please follow up with customers to arrange payment collections. Update the payment status in the Fulfillment tab.</p>`;

      for (const to of recipients) {
        const result = await sendMailWith(config, {
          fromName: "TechBucket Billing",
          to,
          subject,
          text,
          html,
        });
        if (result.ok) sentCount += 1;
      }
    }
  }

  if (mode === "customer" || mode === "both") {
    const withCustomer = overdue.filter((o) =>
      (o.customerEmail ?? "").trim().length > 0
    );
    for (const o of withCustomer) {
      const subject = `Payment reminder — ${o.billNo}`;
      const text = [
        `Dear ${o.customerName},`,
        "",
        `This is a friendly reminder that the payment for bill ${o.billNo} (${o.orderNo}) was due on ${o.paymentDueDate ?? ""} and is now ${daysPastDue(o)} days past due.`,
        "",
        `Amount due: ${money(outstanding(o))}`,
        "",
        "Please arrange payment at your earliest convenience. If you have already paid, please disregard this notice.",
        "",
      ].join("\n");
      const html = `
        <p>Dear ${esc(o.customerName)},</p>
        <p>This is a friendly reminder that your bill <strong>${esc(o.billNo ?? "")}</strong> (${esc(o.orderNo)}) was due on <strong>${esc(o.paymentDueDate ?? "")}</strong> and is now <strong>${daysPastDue(o)} days</strong> past due.</p>
        <p><strong>Amount due: ${money(outstanding(o))}</strong></p>
        <p>Please arrange payment at your earliest convenience. If you have already paid, kindly disregard this notice.</p>`;
      const result = await sendMailWith(config, {
        fromName: "TechBucket Billing",
        to: o.customerEmail.trim(),
        subject,
        text,
        html,
      });
      if (result.ok) dunnedCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    sent: sentCount,
    dunned: dunnedCount,
    overdue: overdue.map((o) => ({
      orderNo: o.orderNo,
      billNo: o.billNo,
      customerName: o.customerName,
      daysPastDue: daysPastDue(o),
    })),
  });
}

function totalOutstanding(orders: FulfillmentOrder[]): number {
  return orders.reduce((s, o) => s + outstanding(o), 0);
}