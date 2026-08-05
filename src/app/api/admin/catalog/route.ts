import { NextResponse } from "next/server";
import { getCurrentUser, type AdminRole } from "@/lib/admin";
import { readJson } from "@/lib/store";

const ALLOWED_ROLES: AdminRole[] = ["superadmin", "sales"];

interface ProductInfo {
  name: string;
  price: number;
}

interface ServiceInfo {
  title: string;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let products: ProductInfo[] = [];
  try {
    products = await readJson<ProductInfo[]>("products.json");
  } catch {
    products = [];
  }
  let services: ServiceInfo[] = [];
  try {
    services = await readJson<ServiceInfo[]>("services.json");
  } catch {
    services = [];
  }

  return NextResponse.json({
    data: {
      products: products
        .filter((p) => p.name && typeof p.price === "number")
        .sort((a, b) => a.name.localeCompare(b.name)),
      services: services
        .filter((s) => s.title)
        .sort((a, b) => a.title.localeCompare(b.title)),
    },
  });
}
