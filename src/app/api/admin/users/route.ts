import { NextRequest, NextResponse } from "next/server";
import {
  encryptSecret,
  getCurrentUser,
  getUsers,
  hashPassword,
  ROLES,
  type AdminRole,
} from "@/lib/admin";
import { writeJson } from "@/lib/store";

const VALID_ROLES = new Set<AdminRole>(ROLES.map((r) => r.value));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await getUsers();
  return NextResponse.json({ data: users });
}

export async function PUT(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current || current.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array" }, { status: 400 });
  }

  const users = await getUsers();
  const updated = body as Array<{
    id: string;
    name: string;
    username: string;
    role: string;
    active: boolean;
    password?: string;
    createdAt?: string;
    email?: string;
    smtpHost?: string;
    smtpPort?: number | string;
    smtpPassword?: string;
  }>;

  const seen = new Set<string>();
  for (const u of updated) {
    const username = (u.username ?? "").trim().toLowerCase();
    if (!username) {
      return NextResponse.json(
        { error: "Every user needs a username" },
        { status: 400 }
      );
    }
    if (seen.has(username)) {
      return NextResponse.json(
        { error: `Duplicate username "${username}"` },
        { status: 400 }
      );
    }
    seen.add(username);
    if (!VALID_ROLES.has(u.role as AdminRole)) {
      return NextResponse.json(
        { error: `Invalid role for "${username}"` },
        { status: 400 }
      );
    }
    if (u.username !== current.username && username === current.username) {
      return NextResponse.json(
        { error: "You cannot take over the signed-in username" },
        { status: 400 }
      );
    }
    const email = (u.email ?? "").trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: `"${username}" has an invalid email address` },
        { status: 400 }
      );
    }
  }

  const selfChanged = updated.find(
    (u) => u.username === current.username
  );
  if (selfChanged) {
    if (selfChanged.active === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }
    if (selfChanged.role !== "superadmin") {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }
    if (selfChanged.username !== current.username) {
      return NextResponse.json(
        { error: "You cannot change your own username" },
        { status: 400 }
      );
    }
  }

  const activeSuperadmins = updated.filter(
    (u) => u.active !== false && u.role === "superadmin"
  ).length;
  if (activeSuperadmins === 0) {
    return NextResponse.json(
      { error: "At least one active superadmin is required" },
      { status: 400 }
    );
  }

  for (const u of updated) {
    if (!u.username && !u.password) {
      continue;
    }
    const existing = users.find((x) => x.username === u.username);
    if (!existing && !(u.password && u.password.length >= 8)) {
      return NextResponse.json(
        {
          error: `New user "${u.username || "(unnamed)"}" needs a password of at least 8 characters`,
        },
        { status: 400 }
      );
    }
    if (
      existing &&
      u.password &&
      u.password.length > 0 &&
      u.password.length < 8
    ) {
      return NextResponse.json(
        { error: "Passwords must be at least 8 characters" },
        { status: 400 }
      );
    }
  }

  const result = updated.map((u) => {
    const existing = users.find((x) => x.username === u.username);
    const email = (u.email ?? "").trim().toLowerCase();
    const smtpHost = (u.smtpHost ?? "").trim();
    const rawPort = u.smtpPort;
    const smtpPort =
      rawPort === undefined || rawPort === null || rawPort === ""
        ? null
        : Number(rawPort);
    const smtpPassword = (u.smtpPassword ?? "").trim();

    let smtpPassEnc = existing?.smtpPassEnc ?? "";
    if (smtpPassword) {
      smtpPassEnc = encryptSecret(smtpPassword);
    }

    if (u.password && u.password.length > 0) {
      const { hash, salt } = hashPassword(u.password);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        passwordHash: hash,
        salt,
        role: u.role,
        active: u.active,
        createdAt: existing?.createdAt ?? u.createdAt ?? new Date().toISOString(),
        email,
        smtpHost,
        smtpPort: Number.isNaN(smtpPort) ? null : smtpPort,
        smtpPassEnc,
        passwordChangedAt: new Date().toISOString(),
      };
    }
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      passwordHash: existing?.passwordHash ?? "",
      salt: existing?.salt ?? "",
      role: u.role,
      active: u.active,
      createdAt: existing?.createdAt ?? u.createdAt ?? new Date().toISOString(),
      email,
      smtpHost,
      smtpPort: Number.isNaN(smtpPort) ? null : smtpPort,
      smtpPassEnc,
      passwordChangedAt: existing?.passwordChangedAt ?? "",
    };
  });

  await writeJson("users.json", result);
  return NextResponse.json({ ok: true });
}
