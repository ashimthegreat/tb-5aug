"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import { genId, slugify } from "@/lib/id";
import ListEditor, { type FieldDef } from "./ListEditor";
import { PrimaryButton } from "./ui";

type Resource = "products" | "product-categories" | "brands" | "partners";

const stockOptions = [
  { value: "in-stock", label: "In stock" },
  { value: "out-of-stock", label: "Out of stock" },
  { value: "on-order", label: "On order" },
];

const purchaseOptions = [
  { value: "purchase", label: "Buy now (purchase)" },
  { value: "quote", label: "Get a quote" },
  { value: "both", label: "Buy or get a quote" },
];

const schemas: Record<
  Resource,
  { title: string; fields: (deps: Record<string, unknown[]>) => FieldDef[]; labelKey?: string }
> = {
  products: {
    title: "Products",
    fields: (deps) => [
      { key: "name", label: "Name", type: "text" },
      { key: "summary", label: "Short summary", type: "textarea" },
      {
        key: "brand",
        label: "Brand",
        type: "select",
        options: (deps.brands ?? []).map((b) => ({
          value: String((b as { id: string }).id),
          label: String((b as { name: string }).name),
        })),
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        options: (deps["product-categories"] ?? []).map((c) => ({
          value: String((c as { id: string }).id),
          label: String((c as { name: string }).name),
        })),
      },
      { key: "images", label: "Product images", type: "images" },
      { key: "price", label: "Price (NPR)", type: "number" },
      { key: "salePrice", label: "Sale price (NPR, optional)", type: "number" },
      { key: "stock", label: "Stock status", type: "select", options: stockOptions },
      {
        key: "purchaseType",
        label: "Purchase type",
        type: "select",
        options: purchaseOptions,
      },
      { key: "slug", label: "Slug (auto from name if empty)", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "specs", label: "Specifications", type: "specs" },
      { key: "features", label: "Features (one per line)", type: "stringlist" },
      { key: "featured", label: "Featured on home page", type: "checkbox" },
      { key: "active", label: "Visible in catalog", type: "checkbox" },
      { key: "order", label: "Order", type: "number" },
    ],
    labelKey: "name",
  },
  "product-categories": {
    title: "Product categories",
    fields: () => [
      { key: "name", label: "Name", type: "text" },
      { key: "icon", label: "Icon", type: "icon" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
    ],
    labelKey: "name",
  },
  brands: {
    title: "Technology partners",
    fields: () => [
      { key: "name", label: "Name", type: "text" },
      { key: "logo", label: "Logo", type: "image" },
      { key: "url", label: "Website URL", type: "text" },
      { key: "blurb", label: "Description", type: "textarea" },
    ],
    labelKey: "name",
  },
  partners: {
    title: "Partners",
    fields: () => [
      { key: "name", label: "Name", type: "text" },
      { key: "logo", label: "Logo (optional)", type: "image" },
      { key: "url", label: "Website URL (optional)", type: "text" },
    ],
    labelKey: "name",
  },
};

function normalizeItems(resource: Resource, items: Record<string, unknown>[]) {
  return items.map((item) => {
    const next = { ...item };
    if (resource === "products") {
      if (!next.slug || String(next.slug).trim() === "") {
        next.slug = slugify(String(next.name || "product"));
      }
      if (!Array.isArray(next.images)) next.images = [];
      if (!Array.isArray(next.specs)) next.specs = [];
      if (!Array.isArray(next.features)) next.features = [];
      next.images = (next.images as string[]).filter(Boolean);
      next.specs = (next.specs as { label: string; value: string }[]).filter(
        (s) => s.label || s.value
      );
      next.price = Number(next.price) || 0;
      next.salePrice = next.salePrice ? Number(next.salePrice) : null;
      next.order = Number(next.order) || 0;
      next.featured = Boolean(next.featured);
      next.active = Boolean(next.active);
    }
    return next;
  });
}

export default function CollectionEditor({ resource }: { resource: Resource }) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [deps, setDeps] = useState<Record<string, unknown[]>>({});
  const [status, setStatus] = useState("");
  const schema = schemas[resource];

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet<Record<string, unknown>[]>(resource),
      ...(resource === "products"
        ? [
            apiGet<Record<string, unknown>[]>("brands"),
            apiGet<Record<string, unknown>[]>("product-categories"),
          ]
        : []),
    ])
      .then(([items, ...extra]) => {
        if (cancelled) return;
        setItems(items);
        if (resource === "products") {
          const [brands, categories] = extra;
          setDeps({ brands, "product-categories": categories });
        }
      })
      .catch((e) => setStatus(`Error: ${e.message}`));
    return () => {
      cancelled = true;
    };
  }, [resource]);

  if (!items) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  const list = items;

  async function save() {
    setStatus("");
    try {
      await apiPut(resource, normalizeItems(resource, list));
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  const prefix = resource.replace(/-/g, "").replace(/s$/, "") || "item";

  return (
    <div className="space-y-3">
      <ListEditor
        title={schema.title}
        fields={schema.fields(deps)}
        items={items}
        onChange={setItems}
        labelKey={schema.labelKey}
        makeDefaults={() => ({
          id: genId(prefix, items.map((i) => String(i.id))),
          name: "",
          icon: "server",
          description: "",
          summary: "",
          features: [],
          specs: [],
          images: [],
          price: 0,
          salePrice: null,
          currency: "NPR",
          stock: "in-stock",
          purchaseType: "purchase",
          brand: "",
          categoryId: "",
          slug: "",
          url: "",
          logo: "",
          blurb: "",
          featured: false,
          active: true,
          order: items.length + 1,
        })}
      />
      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={save}>
          Save
        </PrimaryButton>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
    </div>
  );
}
