import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { aggregateCustomer } from "@/lib/customerDetail";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "saleshead"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "Customer id is required." },
      { status: 400 }
    );
  }

  const data = await aggregateCustomer(id);
  if (!data) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
