"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import { genId } from "@/lib/id";
import ListEditor, { type FieldDef } from "./ListEditor";
import { PrimaryButton } from "./ui";

const fields: FieldDef[] = [
  { key: "name", label: "Scheme name", type: "text" },
  { key: "percent", label: "Discount (%)", type: "number" },
  { key: "note", label: "Note (optional)", type: "textarea" },
  { key: "active", label: "Active (available to sales)", type: "checkbox" },
];

function normalize(items: Record<string, unknown>[]) {
  return items.map((item) => {
    const next = { ...item };
    next.name = String(next.name ?? "").trim();
    next.percent = Math.min(100, Math.max(0, Number(next.percent) || 0));
    next.active = Boolean(next.active);
    next.note = String(next.note ?? "").trim();
    return next;
  });
}

export default function DiscountsEditor() {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<Record<string, unknown>[]>("discounts")
      .then(setItems)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!items) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }
  const list = items;

  async function save() {
    setStatus("");
    try {
      await apiPut("discounts", normalize(list));
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-900">Discount schemes</h3>
      <p className="text-xs text-slate-500">
        Discount schemes are applied by sales when building a quotation. The
        discount is taken off the subtotal before VAT, then VAT is added on the
        reduced amount.
      </p>
      <ListEditor
        title="Discount schemes"
        fields={fields}
        items={list}
        onChange={setItems}
        labelKey="name"
        makeDefaults={() => ({
          id: genId("discount", list.map((i) => String(i.id))),
          name: "",
          percent: 0,
          active: true,
          note: "",
          createdAt: new Date().toISOString(),
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
