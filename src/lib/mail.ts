import "server-only";
import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export function smtpDefaultsFor(email: string): {
  host: string;
  port: number;
  secure: boolean;
} {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  const zoho = { host: "smtp.zoho.com", port: 465, secure: true };
  if (
    domain.endsWith("zoho.com") ||
    domain.endsWith("zoho.eu") ||
    domain.endsWith("zoho.in")
  ) {
    return zoho;
  }
  const map: Record<string, { host: string; port: number; secure: boolean }> = {
    "gmail.com": { host: "smtp.gmail.com", port: 465, secure: true },
    "googlemail.com": { host: "smtp.gmail.com", port: 465, secure: true },
    "outlook.com": { host: "smtp-mail.outlook.com", port: 587, secure: false },
    "hotmail.com": { host: "smtp-mail.outlook.com", port: 587, secure: false },
    "live.com": { host: "smtp-mail.outlook.com", port: 587, secure: false },
    "office365.com": { host: "smtp-mail.outlook.com", port: 587, secure: false },
    "yahoo.com": { host: "smtp.mail.yahoo.com", port: 465, secure: true },
    "icloud.com": { host: "smtp.mail.me.com", port: 587, secure: false },
  };
  return map[domain] ?? zoho;
}

export async function sendMailWith(
  config: SmtpConfig,
  message: MailMessage
): Promise<{ ok: boolean; error?: string }> {
  if (!config.user || !config.pass) {
    return { ok: false, error: "SMTP credentials are not configured." };
  }
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  try {
    await transporter.sendMail({
      from: message.fromName
        ? `"${message.fromName}" <${config.user}>`
        : config.user,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!user || !pass) return false;
  const result = await sendMailWith(
    {
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      user,
      pass,
    },
    {
      ...message,
      fromName: message.fromName ?? "TechBucket Support",
    }
  );
  return result.ok;
}
