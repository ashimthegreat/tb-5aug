import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";

const RESOURCES: Record<string, string> = {
  site: "site.json",
  home: "home.json",
  categories: "categories.json",
  services: "services.json",
  products: "products.json",
  "product-categories": "product-categories.json",
  brands: "brands.json",
  partners: "partners.json",
  careers: "careers.json",
  customers: "customers.json",
  support: "tickets.json",
  discounts: "discounts.json",
};

const RESOURCE_ROLES: Record<string, AdminRole[]> = {
  site: ["superadmin", "content"],
  home: ["superadmin", "content"],
  categories: ["superadmin", "content"],
  services: ["superadmin", "content"],
  products: ["superadmin", "content", "saleshead"],
  "product-categories": ["superadmin", "content", "saleshead"],
  brands: ["superadmin", "content", "saleshead"],
  partners: ["superadmin", "content", "saleshead"],
  careers: ["superadmin", "content"],
  customers: ["superadmin", "saleshead"],
  support: ["superadmin", "support"],
  discounts: ["superadmin"],
};

const RESOURCE_READ_ROLES: Record<string, AdminRole[]> = {
  site: ["superadmin", "content", "sales", "saleshead", "logistics", "support"],
};

const PUBLIC_PATHS = [
  "/",
  "/services",
  "/industries",
  "/products",
  "/products/[slug]",
  "/cart",
  "/checkout",
  "/brands",
  "/partners",
  "/careers",
  "/support",
];

const OBJECT_RESOURCES = new Set(["site", "careers", "home"]);

async function requireAccess(
  resource: string,
  isWrite: boolean
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.active) return false;
  const allowed = isWrite
    ? RESOURCE_ROLES[resource]
    : RESOURCE_READ_ROLES[resource] ?? RESOURCE_ROLES[resource];
  return !!allowed && allowed.includes(user.role);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!(await requireAccess(resource, false))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const file = RESOURCES[resource];
  if (!file) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const data = await readJson(file);
  return NextResponse.json({ data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!(await requireAccess(resource, true))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const file = RESOURCES[resource];
  if (!file) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const body = await req.json();
  const isArrayResource = !OBJECT_RESOURCES.has(resource);
  if (isArrayResource && !Array.isArray(body)) {
    return NextResponse.json(
      { error: `Expected an array for "${resource}"` },
      { status: 400 }
    );
  }
  if (!isArrayResource && (Array.isArray(body) || typeof body !== "object")) {
    return NextResponse.json(
      { error: `Expected an object for "${resource}"` },
      { status: 400 }
    );
  }
  await writeJson(file, body);
  for (const p of PUBLIC_PATHS) revalidatePath(p);
  return NextResponse.json({ ok: true });
}
