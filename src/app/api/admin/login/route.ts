import { NextRequest, NextResponse } from "next/server";
import { clearAuthed, setAuthed, adminPassword } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { password?: string };
  if (body.password !== adminPassword()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  await setAuthed();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAuthed();
  return NextResponse.json({ ok: true });
}
