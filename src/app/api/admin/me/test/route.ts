import { NextResponse } from "next/server";
import { decryptSecret, getCurrentUser } from "@/lib/admin";
import { sendMailWith, smtpDefaultsFor } from "@/lib/mail";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (user.email ?? "").trim().toLowerCase();
  if (!email || !user.smtpPassEnc) {
    return NextResponse.json(
      { error: "No sender email configured. Set your email + SMTP password first." },
      { status: 400 }
    );
  }

  let pass: string;
  try {
    pass = decryptSecret(user.smtpPassEnc);
  } catch {
    return NextResponse.json(
      { error: "Stored SMTP password could not be decrypted. Re-enter it and save." },
      { status: 400 }
    );
  }

  const defaults = smtpDefaultsFor(email);
  const port = user.smtpPort ?? defaults.port;
  const config = {
    host: user.smtpHost || defaults.host,
    port,
    secure: user.smtpPort ? port === 465 : defaults.secure,
    user: email,
    pass,
  };

  const result = await sendMailWith(config, {
    fromName: user.name,
    to: email,
    subject: "TechBucket SMTP test",
    text: `Hello ${user.name},\n\nThis is a test email from the TechBucket admin panel. Your SMTP settings are working correctly.\n\n— TechBucket`,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, to: email });
  }
  return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
}
