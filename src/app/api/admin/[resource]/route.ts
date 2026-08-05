import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/admin";
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
];

const OBJECT_RESOURCES = new Set(["site", "careers"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { resource } = await params;
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
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { resource } = await params;
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
