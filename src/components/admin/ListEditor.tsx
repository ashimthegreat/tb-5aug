"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import IconPicker from "./IconPicker";
import ImageUpload from "./ImageUpload";
import { DangerButton, GhostButton, Input, Label, PrimaryButton, Select, Textarea, fieldInput } from "./ui";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "icon"
  | "image"
  | "images"
  | "stringlist"
  | "specs"
  | "checkbox";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface ListEditorProps {
  title: string;
  fields: FieldDef[];
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
  makeDefaults: () => Record<string, unknown>;
  labelKey?: string;
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputValue = (value ?? "") as string;

  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          label={field.label}
          rows={4}
          value={inputValue}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          label={field.label}
          type="number"
          value={String(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case "select":
      return (
        <Select
          label={field.label}
          options={field.options ?? []}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "icon":
      return <IconPicker value={inputValue} onChange={onChange} />;
    case "image":
      return (
        <ImageUpload label={field.label} value={inputValue || undefined} onChange={onChange} />
      );
    case "stringlist":
      return (
        <div>
          <Label>{field.label}</Label>
          <textarea
            className={fieldInput}
            rows={5}
            value={(value as string[])?.join("\n") ?? ""}
            placeholder={field.placeholder ?? "One item per line"}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          {field.label}
        </label>
      );
    case "images": {
      const imgs = (Array.isArray(value) ? value : []) as string[];
      return (
        <div>
          <Label>{field.label}</Label>
          <div className="space-y-3">
            {imgs.map((img, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <ImageUpload
                    label={`Image ${i + 1}`}
                    value={img || undefined}
                    onChange={(v) => {
                      const next = [...imgs];
                      next[i] = v;
                      onChange(next);
                    }}
                  />
                </div>
                <DangerButton
                  type="button"
                  onClick={() => onChange(imgs.filter((_, j) => j !== i))}
                >
                  Remove
                </DangerButton>
              </div>
            ))}
            {imgs.length === 0 && (
              <p className="text-xs text-slate-400">
                No images yet — add the product image below.
              </p>
            )}
            <GhostButton
              type="button"
              onClick={() => onChange([...imgs, ""])}
            >
              + Add image
            </GhostButton>
          </div>
        </div>
      );
    }
    case "specs": {
      const rows = (Array.isArray(value) ? value : []) as {
        label: string;
        value: string;
      }[];
      return (
        <div>
          <Label>{field.label}</Label>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={fieldInput}
                  placeholder="Label"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], label: e.target.value };
                    onChange(next);
                  }}
                />
                <input
                  className={fieldInput}
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], value: e.target.value };
                    onChange(next);
                  }}
                />
                <DangerButton
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                >
                  ✕
                </DangerButton>
              </div>
            ))}
            <GhostButton
              type="button"
              onClick={() => onChange([...rows, { label: "", value: "" }])}
            >
              + Add row
            </GhostButton>
          </div>
        </div>
      );
    }
    default:
      return (
        <Input
          label={field.label}
          value={inputValue}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function ListEditor({
  title,
  fields,
  items,
  onChange,
  makeDefaults,
  labelKey,
}: ListEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [showNew, setShowNew] = useState(false);

  const labelOf = (item: Record<string, unknown>) =>
    String(item[labelKey ?? fields[0]?.key ?? "name"] ?? "Untitled");

  function beginEdit(item: Record<string, unknown>) {
    setEditingId(String(item.id));
    setDraft({ ...item });
    setShowNew(false);
  }

  function beginNew() {
    const item = makeDefaults();
    setEditingId(String(item.id));
    setDraft(item);
    setShowNew(true);
  }

  function commit() {
    if (!draft) return;
    if (showNew) {
      onChange([...items, draft]);
    } else {
      onChange(items.map((it) => (it.id === draft.id ? draft : it)));
    }
    setEditingId(null);
    setDraft(null);
    setShowNew(false);
  }

  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(null);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(
      next.map((it, i) => ({ ...it, order: i + 1 }))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <PrimaryButton type="button" onClick={beginNew}>
          + Add
        </PrimaryButton>
      </div>

      <ul className="mt-4 space-y-3">
        {showNew && draft && (
          <li className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/40">
            <div className="p-4">
              <p className="mb-4 text-sm font-semibold text-brand-700">
                New item
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className={
                      field.type === "textarea" ||
                      field.type === "stringlist" ||
                      field.type === "specs" ||
                      field.type === "images"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <FieldControl
                      field={field}
                      value={draft[field.key]}
                      onChange={(v) => setDraft({ ...draft, [field.key]: v })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <PrimaryButton type="button" onClick={commit}>
                  Add item
                </PrimaryButton>
                <GhostButton
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDraft(null);
                    setShowNew(false);
                  }}
                >
                  Cancel
                </GhostButton>
              </div>
            </div>
          </li>
        )}
        {items.map((item, index) => {
          const editing = editingId === String(item.id);
          return (
            <li
              key={String(item.id)}
              className="rounded-xl border border-slate-200 bg-white"
            >
              {editing && draft ? (
                <div className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => (
                      <div
                        key={field.key}
                        className={
                          field.type === "textarea" ||
                          field.type === "stringlist" ||
                          field.type === "specs" ||
                          field.type === "images"
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <FieldControl
                          field={field}
                          value={draft[field.key]}
                          onChange={(v) => setDraft({ ...draft, [field.key]: v })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <PrimaryButton type="button" onClick={commit}>
                      Save
                    </PrimaryButton>
                    <GhostButton
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setDraft(null);
                        setShowNew(false);
                      }}
                    >
                      Cancel
                    </GhostButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        className="text-slate-400 hover:text-slate-700"
                        aria-label="Move up"
                      >
                        <Icon name="menu" className="h-3 w-3 rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        className="text-slate-400 hover:text-slate-700"
                        aria-label="Move down"
                      >
                        <Icon name="menu" className="h-3 w-3" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {labelOf(item)}
                      </p>
                      <p className="text-xs text-slate-400">{String(item.id)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GhostButton type="button" onClick={() => beginEdit(item)}>
                      Edit
                    </GhostButton>
                    <DangerButton type="button" onClick={() => remove(String(item.id))}>
                      Delete
                    </DangerButton>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
