import "server-only";
import { getProducts } from "./data";
import { effectivePrice } from "./format";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// Resolves the authoritative unit price for a client-supplied item by
// matching it against the product catalog. Falls back to the supplied price
// (still bounded by the caller) when no catalog match exists, so enquiry
// lines and services keep working.
export async function resolveCatalogPrice(
  itemName: string,
  clientPrice: number
): Promise<number> {
  const products = await getProducts();
  const key = normalize(itemName);
  for (const p of products) {
    if (p.name && normalize(p.name) === key) return effectivePrice(p);
    if (p.slug && normalize(p.slug) === key) return effectivePrice(p);
  }
  return clientPrice;
}
