import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { listFulfillment } from "@/lib/fulfillment";
import { paidTotal, paymentStatus } from "@/lib/payment";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";

  const orders = await listFulfillment();
  const billed = orders.filter(
    (o) =>
      o.billNo &&
      o.status !== "cancelled" &&
      (!from || (o.billedAt ?? "") >= from) &&
      (!to || (o.billedAt ?? "") <= to)
  );

  const seenBillNo = new Set<string>();
  const uniqueBills = billed.filter((o) => {
    if (!o.billNo || seenBillNo.has(o.billNo)) return false;
    seenBillNo.add(o.billNo);
    return true;
  });

  const vat = uniqueBills.reduce((s, o) => s + (o.vat ?? 0), 0);
  const received = uniqueBills.reduce(
    (s, o) => s + (paymentStatus(o) === "received" ? paidTotal(o) : 0),
    0
  );
  const receivable = uniqueBills.reduce((s, o) => s + o.total - paidTotal(o), 0);

  return NextResponse.json({
    ok: true,
    range: { from, to },
    bills: uniqueBills.length,
    total: Math.round(billed.reduce((s, o) => s + o.total, 0) * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    received: Math.round(received * 100) / 100,
    receivable: Math.round(receivable * 100) / 100,
  });
}