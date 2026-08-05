import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin";
import { resolveSender, sendMailWith } from "@/lib/mail";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sender = await resolveSender();
  if (!sender) {
    return NextResponse.json(
      { error: "No sender email configured. Set your email + SMTP password first." },
      { status: 400 }
    );
  }

  const to = (user.email ?? "").trim().toLowerCase() || sender.email;
  const result = await sendMailWith(
    {
      host: sender.host,
      port: sender.port,
      secure: sender.secure,
      user: sender.email,
      pass: sender.pass,
    },
    {
      fromName: user.name,
      to,
      subject: "TechBucket SMTP test",
      text: `Hello ${user.name},\n\nThis is a test email from the TechBucket admin panel. Your SMTP settings are working correctly.\n\n— TechBucket`,
    }
  );

  if (result.ok) {
    return NextResponse.json({ ok: true, to });
  }
  return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
}
