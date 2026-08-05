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

interface SiteInfo {
  name?: string;
  contact?: {
    email?: string;
    address?: string;
    phones?: { label: string }[];
    vatNo?: string;
  };
}

interface DiscountInfo {
  id: string;
  name: string;
  percent: number;
  active?: boolean;
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
  let discounts: DiscountInfo[] = [];
  try {
    discounts = await readJson<DiscountInfo[]>("discounts.json");
  } catch {
    discounts = [];
  }

  let site: SiteInfo = {};
  try {
    site = await readJson<SiteInfo>("site.json");
  } catch {
    site = {};
  }
  const contact = site.contact ?? {};

  return NextResponse.json({
    data: {
      products: products
        .filter((p) => p.name && typeof p.price === "number")
        .sort((a, b) => a.name.localeCompare(b.name)),
      services: services
        .filter((s) => s.title)
        .sort((a, b) => a.title.localeCompare(b.title)),
      discounts: discounts
        .filter(
          (d) =>
            d.active !== false &&
            d.name &&
            typeof d.percent === "number" &&
            d.percent > 0
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
      company: {
        name: site.name ?? "TechBucket",
        email: contact.email ?? "",
        address: contact.address ?? "",
        phones: (contact.phones ?? []).map((p) => p.label),
        vatNo: contact.vatNo ?? "",
      },
    },
  });
}
