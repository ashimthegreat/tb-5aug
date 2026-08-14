"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/data";
import { apiGet, apiPut } from "@/lib/adminApi";
import { DangerButton, GhostButton, Input, Label, PrimaryButton, Textarea, fieldInput } from "./ui";

function SimpleList({
  label,
  value,
  onChange,
  keys,
}: {
  label: string;
  value: Record<string, string>[];
  onChange: (value: Record<string, string>[]) => void;
  keys: { key: string; label: string; textarea?: boolean }[];
}) {
  const items = value;

  function updateItems(next: Record<string, string>[]) {
    onChange(next);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <GhostButton
          type="button"
          onClick={() =>
            updateItems([
              ...items,
              Object.fromEntries(keys.map((k) => [k.key, ""])),
            ])
          }
        >
          + Add
        </GhostButton>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              {keys.map((k) =>
                k.textarea ? (
                  <div key={k.key} className="sm:col-span-2">
                    <Label>{k.label}</Label>
                    <textarea
                      className={fieldInput}
                      rows={3}
                      value={item[k.key] ?? ""}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = { ...next[index], [k.key]: e.target.value };
                        updateItems(next);
                      }}
                    />
                  </div>
                ) : (
                  <div key={k.key}>
                    <Label>{k.label}</Label>
                    <input
                      className={fieldInput}
                      value={item[k.key] ?? ""}
                      onChange={(e) => {
                        const next = [...items];
                        next[index] = { ...next[index], [k.key]: e.target.value };
                        updateItems(next);
                      }}
                    />
                  </div>
                )
              )}
            </div>
            <DangerButton
              type="button"
              className="mt-6"
              onClick={() => updateItems(items.filter((_, i) => i !== index))}
            >
              ×
            </DangerButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteEditor() {
  const [site, setSite] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<SiteContent>("site")
      .then(setSite)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!site) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      await apiPut("site", site);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const set = (path: (string | number)[], value: unknown) => {
    setSite((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      let node: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        node = node[path[i]] as Record<string, unknown>;
      }
      node[path[path.length - 1]] = value;
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Company name"
          value={site.name}
          onChange={(e) => set(["name"], e.target.value)}
        />
        <Input
          label="Site URL"
          value={site.url}
          onChange={(e) => set(["url"], e.target.value)}
        />
        <div className="lg:col-span-2">
          <Textarea
            label="Tagline"
            value={site.tagline}
            onChange={(e) => set(["tagline"], e.target.value)}
          />
        </div>
      </section>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">Hero</legend>
        <div className="grid gap-4">
          <Input
            label="Eyebrow"
            value={site.hero.eyebrow}
            onChange={(e) => set(["hero", "eyebrow"], e.target.value)}
          />
          <Input
            label="Title"
            value={site.hero.title}
            onChange={(e) => set(["hero", "title"], e.target.value)}
          />
          <Textarea
            label="Subtitle"
            value={site.hero.subtitle}
            onChange={(e) => set(["hero", "subtitle"], e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">About</legend>
        <div className="space-y-4">
          <Input
            label="Heading"
            value={site.about.title}
            onChange={(e) => set(["about", "title"], e.target.value)}
          />
          <SimpleList
            label="Paragraphs"
            value={site.about.paragraphs.map((p, i) => ({ _: p, __index: String(i) }))}
            onChange={(next) =>
              set(["about", "paragraphs"], next.map((n) => n._).filter(Boolean))
            }
            keys={[{ key: "_", label: "Paragraph", textarea: true }]}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Stats
        </legend>
        <SimpleList
          label="Stats"
          value={site.stats}
          onChange={(next) => set(["stats"], next)}
          keys={[
            { key: "value", label: "Value" },
            { key: "label", label: "Label" },
          ]}
        />
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Mission & Vision
        </legend>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Mission title"
              value={site.mission.title}
              onChange={(e) => set(["mission", "title"], e.target.value)}
            />
            <Input
              label="Vision title"
              value={site.vision.title}
              onChange={(e) => set(["vision", "title"], e.target.value)}
            />
          </div>
          <Textarea
            label="Mission body"
            value={site.mission.body}
            onChange={(e) => set(["mission", "body"], e.target.value)}
          />
          <Textarea
            label="Vision body"
            value={site.vision.body}
            onChange={(e) => set(["vision", "body"], e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Values
        </legend>
        <SimpleList
          label="Values"
          value={site.values}
          onChange={(next) => set(["values"], next)}
          keys={[
            { key: "title", label: "Title" },
            { key: "body", label: "Body", textarea: true },
          ]}
        />
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">
          Contact
        </legend>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Email"
              value={site.contact.email}
              onChange={(e) => set(["contact", "email"], e.target.value)}
            />
            <Input
              label="VAT No."
              value={site.contact.vatNo}
              onChange={(e) => set(["contact", "vatNo"], e.target.value)}
            />
          </div>
          <Textarea
            label="Address"
            value={site.contact.address}
            onChange={(e) => set(["contact", "address"], e.target.value)}
          />
          <Input
            label="Heading"
            value={site.contact.heading}
            onChange={(e) => set(["contact", "heading"], e.target.value)}
          />
          <Textarea
            label="Subheading"
            value={site.contact.subheading}
            onChange={(e) => set(["contact", "subheading"], e.target.value)}
          />
          <SimpleList
            label="Phone numbers"
            value={site.contact.phones}
            onChange={(next) => set(["contact", "phones"], next)}
            keys={[
              { key: "label", label: "Display label" },
              { key: "href", label: "tel: link" },
            ]}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-900">Footer</legend>
        <Textarea
          label="Footer blurb"
          value={site.footer.blurb}
          onChange={(e) => set(["footer", "blurb"], e.target.value)}
        />
      </fieldset>

      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save content"}
        </PrimaryButton>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
    </div>
  );
}
