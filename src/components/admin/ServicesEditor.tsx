"use client";

import { useEffect, useState } from "react";
import type { Service, ServiceCategory } from "@/lib/data";
import { apiGet, apiPut } from "@/lib/adminApi";
import { genId } from "@/lib/id";
import ListEditor, { type FieldDef } from "./ListEditor";
import { PrimaryButton } from "./ui";

const categoryFields: FieldDef[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "icon", label: "Icon", type: "icon" },
  { key: "description", label: "Description", type: "textarea" },
];

function serviceFields(categories: ServiceCategory[]): FieldDef[] {
  return [
    { key: "title", label: "Title", type: "text" },
    {
      key: "categoryId",
      label: "Category",
      type: "select",
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    { key: "icon", label: "Icon", type: "icon" },
    { key: "description", label: "Description", type: "textarea" },
  ];
}

export default function ServicesEditor() {
  const [categories, setCategories] = useState<ServiceCategory[] | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    Promise.all([apiGet<ServiceCategory[]>("categories"), apiGet<Service[]>("services")])
      .then(([cats, srv]) => {
        setCategories(cats);
        setServices(srv);
      })
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!categories || !services) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  async function save(resource: "categories" | "services", data: unknown) {
    setStatus("");
    try {
      await apiPut(resource, data);
      setStatus(`Saved ${resource}`);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <ListEditor
          title="Service categories"
          fields={categoryFields}
          items={categories as unknown as Record<string, unknown>[]}
          onChange={(items) => setCategories(items as unknown as ServiceCategory[])}
          makeDefaults={() => ({
            id: genId("cat", categories.map((c) => c.id)),
            name: "",
            icon: "hospital",
            description: "",
          })}
        />
        <div>
          <PrimaryButton
            type="button"
            onClick={() => save("categories", categories)}
          >
            Save categories
          </PrimaryButton>
        </div>
      </div>

      <div className="space-y-3">
        <ListEditor
          title="Services"
          fields={serviceFields(categories)}
          items={services as unknown as Record<string, unknown>[]}
          onChange={(items) => setServices(items as unknown as Service[])}
          makeDefaults={() => ({
            id: genId("svc", services.map((s) => s.id)),
            categoryId: categories[0]?.id ?? "",
            icon: "building",
            title: "",
            description: "",
          })}
        />
        <div>
          <PrimaryButton
            type="button"
            onClick={() => save("services", services)}
          >
            Save services
          </PrimaryButton>
        </div>
      </div>

      {status && <p className="text-sm text-slate-500">{status}</p>}
    </div>
  );
}
