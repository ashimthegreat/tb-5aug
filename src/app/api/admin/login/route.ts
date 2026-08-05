import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthed,
  setAuthed,
  adminPassword,
  adminUsername,
} from "@/lib/admin";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    username?: string;
    password?: string;
  };
  if (
    body.username !== adminUsername() ||
    body.password !== adminPassword()
  ) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }
  await setAuthed();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAuthed();
  return NextResponse.json({ ok: true });
}
