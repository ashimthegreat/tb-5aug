import { NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales"];

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
