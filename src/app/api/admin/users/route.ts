import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  getUsers,
  hashPassword,
  ROLES,
  type AdminRole,
} from "@/lib/admin";
import { writeJson } from "@/lib/store";

const VALID_ROLES = new Set<AdminRole>(ROLES.map((r) => r.value));

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
    passwordHash?: string;
    salt?: string;
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
    if (!existing && !(u.password && u.password.length > 0)) {
      return NextResponse.json(
        { error: `New user "${u.username || "(unnamed)"}" needs a password` },
        { status: 400 }
      );
    }
  }

  const result = updated.map((u) => {
    const existing = users.find((x) => x.username === u.username);
    const { password, ...rest } = u;
    if (password && password.length > 0) {
      const { hash, salt } = hashPassword(password);
      return { ...rest, passwordHash: hash, salt };
    }
    return {
      ...rest,
      passwordHash: existing?.passwordHash ?? "",
      salt: existing?.salt ?? "",
    };
  });

  await writeJson("users.json", result);
  return NextResponse.json({ ok: true });
}
