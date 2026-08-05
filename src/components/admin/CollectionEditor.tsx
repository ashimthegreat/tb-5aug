"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import { genId } from "@/lib/id";
import ListEditor, { type FieldDef } from "./ListEditor";
import { PrimaryButton } from "./ui";

type Resource = "products" | "brands" | "partners";

const schemas: Record<
  Resource,
  { title: string; fields: FieldDef[] }
> = {
  products: {
    title: "Products",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "icon", label: "Icon", type: "icon" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "features", label: "Features (one per line)", type: "stringlist" },
      { key: "url", label: "URL (optional)", type: "text" },
    ],
  },
  brands: {
    title: "Technology partners",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "logo", label: "Logo", type: "image" },
      { key: "url", label: "Website URL", type: "text" },
      { key: "blurb", label: "Description", type: "textarea" },
    ],
  },
  partners: {
    title: "Partners",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "logo", label: "Logo (optional)", type: "image" },
      { key: "url", label: "Website URL (optional)", type: "text" },
    ],
  },
};

export default function CollectionEditor({ resource }: { resource: Resource }) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [status, setStatus] = useState("");
  const schema = schemas[resource];

  useEffect(() => {
    apiGet<Record<string, unknown>[]>(resource)
      .then(setItems)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, [resource]);

  if (!items) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  async function save() {
    setStatus("");
    try {
      await apiPut(resource, items);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-3">
      <ListEditor
        title={schema.title}
        fields={schema.fields}
        items={items}
        onChange={setItems}
        makeDefaults={() => ({
          id: genId(resource.replace(/s$/, ""), items.map((i) => String(i.id))),
          name: "",
          icon: "server",
          blurb: "",
          tagline: "",
          description: "",
          features: [],
          url: "",
          logo: "",
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
