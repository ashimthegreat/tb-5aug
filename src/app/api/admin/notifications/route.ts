import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { buildNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await buildNotifications(user.role);
  return NextResponse.json({ data });
}