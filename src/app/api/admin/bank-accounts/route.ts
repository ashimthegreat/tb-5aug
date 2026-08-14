import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";

const READ_ROLES: AdminRole[] = ["superadmin", "sales", "saleshead"];
const WRITE_ROLES: AdminRole[] = ["superadmin"];

const FILE = "bank-accounts.json";

interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
}

async function requireRole(roles: AdminRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.active) return false;
  return roles.includes(user.role);
}

function normalize(items: unknown): BankAccount[] {
  if (!Array.isArray(items)) return [];
  return items.filter((it): it is BankAccount => {
    if (!it || typeof it !== "object") return false;
    const a = it as Record<string, unknown>;
    return (
      typeof a.accountName === "string" &&
      typeof a.accountNumber === "string" &&
      typeof a.bankName === "string"
    );
  });
}

export async function GET() {
  if (!(await requireRole(READ_ROLES))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let data: BankAccount[] = [];
  try {
    data = await readJson<BankAccount[]>(FILE);
  } catch {
    data = [];
  }
  if (data.length === 0) {
    let site: { bank?: BankAccount } | null = null;
    try {
      site = await readJson<{ bank?: BankAccount }>("site.json");
    } catch {
      site = null;
    }
    if (site?.bank) data.push(site.bank);
  }
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  if (!(await requireRole(WRITE_ROLES))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await writeJson(FILE, normalize(body));
  return NextResponse.json({ ok: true });
}