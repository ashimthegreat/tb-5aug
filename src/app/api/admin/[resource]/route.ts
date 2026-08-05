import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson, writeJson } from "@/lib/store";

const RESOURCES: Record<string, string> = {
  site: "site.json",
  categories: "categories.json",
  services: "services.json",
  products: "products.json",
  "product-categories": "product-categories.json",
  brands: "brands.json",
  partners: "partners.json",
  careers: "careers.json",
  support: "tickets.json",
};

const RESOURCE_ROLES: Record<string, AdminRole[]> = {
  site: ["superadmin", "content"],
  categories: ["superadmin", "content"],
  services: ["superadmin", "content"],
  products: ["superadmin", "content", "sales"],
  "product-categories": ["superadmin", "content", "sales"],
  brands: ["superadmin", "content", "sales"],
  partners: ["superadmin", "content", "sales"],
  careers: ["superadmin", "content"],
  support: ["superadmin", "support"],
};

const PUBLIC_PATHS = [
  "/",
  "/services",
  "/products",
  "/products/[slug]",
  "/cart",
  "/checkout",
  "/brands",
  "/partners",
  "/careers",
  "/support",
];

const OBJECT_RESOURCES = new Set(["site", "careers"]);

async function requireAccess(resource: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.active) return false;
  const allowed = RESOURCE_ROLES[resource];
  return !!allowed && allowed.includes(user.role);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!(await requireAccess(resource))) {
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
  if (!(await requireAccess(resource))) {
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
