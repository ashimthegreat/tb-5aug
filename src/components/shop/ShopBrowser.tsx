"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product, ProductCategory } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { Icon } from "@/components/icons";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export default function ShopBrowser({
  products,
  categories,
}: {
  products: Product[];
  categories: ProductCategory[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.active);
    if (cat !== "all") list = list.filter((p) => p.categoryId === cat);
    if (brand !== "all") list = list.filter((p) => p.brand === brand);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list = [...list].sort((a, b) => a.order - b.order);
    }
    return list;
  }, [products, cat, brand, query, sort]);

  const activeCat = categories.find((c) => c.id === cat);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="spark" className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCat("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            cat === "all"
              ? "bg-brand-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-700"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              cat === c.id
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-700"
            }`}
          >
            {c.name}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-brand-500 focus:outline-none"
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {activeCat && (
        <p className="mt-6 flex items-start gap-2 text-sm text-slate-600">
          <Icon name="layers" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          {activeCat.description}
        </p>
      )}

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-ink">No products found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting your search or filters, or
          </p>
          <Link
            href="mailto:info@techbucket.com.np?subject=Product%20enquiry"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Contact us for a product
          </Link>
        </div>
      )}
    </div>
  );
}
