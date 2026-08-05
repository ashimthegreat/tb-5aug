"use client";

import { useEffect, useState } from "react";
import type { CareersContent } from "@/lib/data";
import { apiGet, apiPut } from "@/lib/adminApi";
import { genId } from "@/lib/id";
import ListEditor, { type FieldDef } from "./ListEditor";
import { Input, PrimaryButton, Textarea } from "./ui";

const perkFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "icon", label: "Icon", type: "icon" },
  { key: "description", label: "Description", type: "textarea" },
];

export default function CareersEditor() {
  const [careers, setCareers] = useState<CareersContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<CareersContent>("careers")
      .then(setCareers)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!careers) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      await apiPut("careers", careers);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof CareersContent, value: unknown) =>
    setCareers((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="space-y-8">
      <ListEditor
        title="Perks"
        fields={perkFields}
        items={careers.perks as unknown as Record<string, unknown>[]}
        onChange={(items) => set("perks", items)}
        makeDefaults={() => ({
          id: genId("perk", careers.perks.map((p) => p.id)),
          icon: "heart",
          title: "",
          description: "",
        })}
        labelKey="title"
      />

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Open positions section
        </legend>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            label="Positions heading"
            value={careers.positionsTitle}
            onChange={(e) => set("positionsTitle", e.target.value)}
          />
          <Input
            label="Empty state title"
            value={careers.emptyTitle}
            onChange={(e) => set("emptyTitle", e.target.value)}
          />
          <div className="lg:col-span-2">
            <Textarea
              label="Empty state message"
              value={careers.emptyMessage}
              onChange={(e) => set("emptyMessage", e.target.value)}
            />
          </div>
          <Input
            label="Empty state CTA"
            value={careers.emptyCta}
            onChange={(e) => set("emptyCta", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Speculative application section
        </legend>
        <div className="grid gap-4">
          <Input
            label="Title"
            value={careers.speculativeTitle}
            onChange={(e) => set("speculativeTitle", e.target.value)}
          />
          <Textarea
            label="Message"
            value={careers.speculativeMessage}
            onChange={(e) => set("speculativeMessage", e.target.value)}
          />
          <Input
            label="CTA"
            value={careers.speculativeCta}
            onChange={(e) => set("speculativeCta", e.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save careers"}
        </PrimaryButton>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
    </div>
  );
}
