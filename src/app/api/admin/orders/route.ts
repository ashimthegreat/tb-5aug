import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { listOrders, updateOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales", "saleshead"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await listOrders();
  orders.sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
  );

  return NextResponse.json({ data: orders });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { id?: string; quoteStatus?: string; customerId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }

  const patch: Parameters<typeof updateOrder>[1] = {};
  const quoteStatus = body.quoteStatus === "quoted" ? "quoted" : "pending";
  if (body.quoteStatus !== undefined) {
    patch.quoteStatus = quoteStatus;
    patch.quotedAt = new Date().toISOString();
    patch.quotedBy = user.name;
  }
  if (body.customerId !== undefined) {
    patch.customerId = (body.customerId ?? "").trim() || undefined;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await updateOrder(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, record: updated });
}
