import { NextRequest, NextResponse } from "next/server";
import { clearAuthed, setAuthed, verifyCredentials } from "@/lib/admin";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  let username = "";
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
    };
    username = (body.username ?? "").trim().toLowerCase();
    const rateKey = `login:${ip}:${username}`;
    const ipKey = `login:${ip}`;
    if (
      isRateLimited(rateKey, 5, 15 * 60 * 1000) ||
      isRateLimited(ipKey, 20, 15 * 60 * 1000)
    ) {
      await delay(300);
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }
    const user = await verifyCredentials(username, body.password ?? "");
    await delay(300);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }
    await setAuthed(user.username);
    return NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword === true,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  await clearAuthed();
  return NextResponse.json({ ok: true });
}
