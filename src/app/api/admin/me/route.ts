import { NextRequest, NextResponse } from "next/server";
import {
  encryptSecret,
  getCurrentUser,
  getUsers,
  hashPassword,
} from "@/lib/admin";
import { writeJson } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    email?: string;
    smtpHost?: string;
    smtpPort?: number | string;
    smtpPassword?: string;
    password?: string;
    signatory?: string;
    designation?: string;
    signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  const smtpHost = (body.smtpHost ?? "").trim();
  const rawPort = body.smtpPort;
  const smtpPort =
    rawPort === undefined || rawPort === null || rawPort === ""
      ? null
      : Number(rawPort);
  const smtpPassword = (body.smtpPassword ?? "").trim();
  const loginPassword = body.password ?? "";

  if (loginPassword && loginPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const users = await getUsers();
  const idx = users.findIndex((u) => u.username === current.username);
  if (idx === -1) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const next = { ...users[idx] };
  next.email = email;
  next.smtpHost = smtpHost;
  next.smtpPort = Number.isNaN(smtpPort) ? null : smtpPort;
  next.signatory = (body.signatory ?? "").trim();
  next.designation = (body.designation ?? "").trim();
  next.signature = (body.signature ?? "").trim();
  if (smtpPassword) {
    next.smtpPassEnc = encryptSecret(smtpPassword);
  }
  if (loginPassword) {
    const { hash, salt } = hashPassword(loginPassword);
    next.passwordHash = hash;
    next.salt = salt;
    next.passwordChangedAt = new Date().toISOString();
  }

  users[idx] = next;
  await writeJson("users.json", users);
  return NextResponse.json({ ok: true });
}
