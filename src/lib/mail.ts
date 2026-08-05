import "server-only";
import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  const user = process.env.SMTP_USER || "";
  if (!user || !process.env.SMTP_PASS) return false;
  try {
    await transporter().sendMail({
      from: `"TechBucket Support" <${process.env.SUPPORT_FROM || user}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  } catch {
    return false;
  }
}
