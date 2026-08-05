import type { Product, ProductStock, PurchaseType } from "@/lib/data";

export function formatNPR(value: number): string {
  return "Rs. " + value.toLocaleString("en-IN");
}

export function effectivePrice(p: Pick<Product, "price" | "salePrice">): number {
  return p.salePrice ?? p.price;
}

export const stockLabels: Record<ProductStock, string> = {
  "in-stock": "In Stock",
  "out-of-stock": "Out of Stock",
  "on-order": "On Order",
};

export const stockBadge: Record<ProductStock, string> = {
  "in-stock": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "out-of-stock": "bg-slate-100 text-slate-600 ring-slate-500/20",
  "on-order": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export const purchaseLabels: Record<PurchaseType, string> = {
  purchase: "Buy now",
  quote: "Get a quote",
  both: "Buy or get a quote",
};

export const contactEmail = "info@techbucket.com.np";
export const whatsappNumber = "9779801151658";

export function mailtoForProduct(
  product: Pick<Product, "name">,
  qty: number,
  message?: string
): string {
  const subject = encodeURIComponent(`Enquiry: ${product.name}`);
  const body = encodeURIComponent(
    `${message ? message + "\n\n" : ""}Product: ${product.name}\nQuantity: ${qty}`
  );
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}

export function whatsappOrderLink(items: { name: string; qty: number }[]) {
  const text = encodeURIComponent(
    `Hello TechBucket,\n\nI would like to place an order:\n${items
      .map((it) => `- ${it.name} x${it.qty}`)
      .join("\n")}`
  );
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
