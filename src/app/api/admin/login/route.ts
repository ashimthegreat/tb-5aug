import { NextRequest, NextResponse } from "next/server";
import { clearAuthed, setAuthed, verifyCredentials } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    username?: string;
    password?: string;
  };
  const user = await verifyCredentials(
    (body.username ?? "").trim().toLowerCase(),
    body.password ?? ""
  );
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }
  await setAuthed(user.username);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAuthed();
  return NextResponse.json({ ok: true });
}
