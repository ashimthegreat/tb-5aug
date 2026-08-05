"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import {
  DangerButton,
  GhostButton,
  Input,
  Label,
  PrimaryButton,
  Textarea,
} from "./ui";

interface Catalog {
  products: { name: string; price: number }[];
  services: { title: string }[];
}

interface QuoteLine {
  id: string;
  type: "item" | "service";
  description: string;
  qty: number;
  price: number;
}

interface Quote {
  id: string;
  quoteNo?: string;
  to: string;
  subject: string;
  items?: QuoteLine[];
  vatRate?: number;
  subtotal?: number;
  vat?: number;
  total?: number;
  notes?: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  quotes?: Quote[];
}

function blankQuoteLine(type: "item" | "service"): QuoteLine {
  return { id: crypto.randomUUID(), type, description: "", qty: 1, price: 0 };
}

function money(n: number): string {
  return `NPR ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function blankCustomer(createdBy: string): Customer {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
    createdBy,
    createdAt: new Date().toISOString(),
    quotes: [],
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CustomersEditor({
  user,
}: {
  user: { name: string; username: string; email?: string };
}) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [status, setStatus] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [quoteTarget, setQuoteTarget] = useState<Customer | null>(null);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([]);
  const [quoteVatRate, setQuoteVatRate] = useState("13");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    apiGet<Customer[]>("customers")
      .then(setCustomers)
      .catch((e) => setStatus(`Error: ${e.message}`));
    apiGet<Catalog>("catalog")
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, []);

  function update(id: string, patch: Partial<Customer>) {
    setCustomers((prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, ...patch } : c)) : prev
    );
  }

  function addNew() {
    const blank = blankCustomer(user.username);
    setCustomers((prev) =>
      prev ? [blank, ...prev] : [blank]
    );
    setEditingId(blank.id);
    setShowNew(true);
    setStatus("");
  }

  function remove(id: string) {
    setCustomers((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    if (editingId === id) {
      setEditingId(null);
      setShowNew(false);
    }
  }

  async function save() {
    if (!customers) return;
    const cleaned = customers.filter((c) => c.name.trim() || c.email.trim());
    setStatus("");
    try {
      await apiPut("customers", cleaned);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  function openQuote(c: Customer) {
    setQuoteTarget(c);
    setQuoteLines([blankQuoteLine("item")]);
    setQuoteVatRate("13");
    setQuoteNotes("");
    setQuoteStatus("");
  }

  function addLine(type: "item" | "service") {
    setQuoteLines((prev) => [...prev, blankQuoteLine(type)]);
  }

  function updateLine(id: string, patch: Partial<QuoteLine>) {
    setQuoteLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  function removeLine(id: string) {
    setQuoteLines((prev) => prev.filter((l) => l.id !== id));
  }

  function addFromProducts(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    if (!name || !catalog) return;
    const p = catalog.products.find((x) => x.name === name);
    if (p) {
      const line = blankQuoteLine("item");
      setQuoteLines((prev) => [
        ...prev,
        { ...line, description: p.name, price: p.price },
      ]);
    }
  }

  function addFromServices(e: React.ChangeEvent<HTMLSelectElement>) {
    const title = e.target.value;
    if (!title || !catalog) return;
    const line = blankQuoteLine("service");
    setQuoteLines((prev) => [...prev, { ...line, description: title }]);
  }

  const subtotal = round2(
    quoteLines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0)
  );
  const vatRate = Number(quoteVatRate);
  const effectiveVatRate =
    Number.isFinite(vatRate) && vatRate > 0 ? Math.min(100, vatRate) : 0;
  const vat = round2((subtotal * effectiveVatRate) / 100);
  const grandTotal = round2(subtotal + vat);

  async function sendQuote() {
    if (!quoteTarget) return;
    if (!quoteTarget.email.trim()) {
      setQuoteStatus("Failed: add an email address for this customer first.");
      return;
    }
    const validLines = quoteLines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      setQuoteStatus("Failed: add at least one item or service.");
      return;
    }
    setSending(true);
    setQuoteStatus("");
    try {
      const cleaned = customers?.filter((c) => c.name.trim() || c.email.trim());
      if (cleaned) await apiPut("customers", cleaned);
      const res = await fetch("/api/admin/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: quoteTarget.id,
          items: validLines.map((l) => ({
            type: l.type,
            description: l.description.trim(),
            qty: Number(l.qty) || 1,
            price: Number(l.price) || 0,
          })),
          vatRate: effectiveVatRate,
          notes: quoteNotes.trim(),
        }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setQuoteStatus("Quote sent to " + quoteTarget.email);
        await apiGet<Customer[]>("customers").then(setCustomers);
        setTimeout(() => setQuoteTarget(null), 1200);
      } else {
        setQuoteStatus(`Failed: ${body.error || "could not send"}`);
      }
    } catch (e) {
      setQuoteStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  if (!customers) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  const sorted = [...customers].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          Customers ({customers.length})
        </h3>
        <div className="flex items-center gap-2">
          {status && <span className="text-sm text-slate-500">{status}</span>}
          <GhostButton type="button" onClick={addNew}>
            + Add customer
          </GhostButton>
          <PrimaryButton type="button" onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>

      {sorted.length === 0 && !showNew ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No customers yet. Add your first customer to start sending quotes.
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((c) => {
            const editing = editingId === c.id;
            const quotes = c.quotes ?? [];
            return (
              <li
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white"
              >
                {editing ? (
                  <div className="p-4">
                    <p className="mb-4 text-sm font-semibold text-brand-700">
                      {showNew ? "New customer" : "Edit customer"}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Name *"
                        value={c.name}
                        onChange={(e) => update(c.id, { name: e.target.value })}
                      />
                      <Input
                        label="Email *"
                        type="email"
                        value={c.email}
                        onChange={(e) => update(c.id, { email: e.target.value })}
                      />
                      <Input
                        label="Phone"
                        value={c.phone}
                        onChange={(e) => update(c.id, { phone: e.target.value })}
                      />
                      <Input
                        label="Company"
                        value={c.company}
                        onChange={(e) =>
                          update(c.id, { company: e.target.value })
                        }
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Address"
                          value={c.address}
                          onChange={(e) =>
                            update(c.id, { address: e.target.value })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Textarea
                          label="Notes"
                          rows={3}
                          value={c.notes}
                          onChange={(e) => update(c.id, { notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setShowNew(false);
                          void save();
                        }}
                      >
                        Done
                      </PrimaryButton>
                      <DangerButton
                        type="button"
                        onClick={() => remove(c.id)}
                      >
                        Delete
                      </DangerButton>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {c.name || "Untitled customer"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {c.email}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </p>
                        {(c.company || c.address) && (
                          <p className="mt-1 text-xs text-slate-400">
                            {[c.company, c.address].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          Added by {c.createdBy || "—"} · {formatDate(c.createdAt)}
                        </p>
                        {c.notes && (
                          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                            {c.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <GhostButton
                          type="button"
                          onClick={() => {
                            setShowNew(false);
                            setEditingId(c.id);
                          }}
                        >
                          Edit
                        </GhostButton>
                        <PrimaryButton type="button" onClick={() => openQuote(c)}>
                          Send quote
                        </PrimaryButton>
                      </div>
                    </div>

                    {quotes.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <Label>Quote history</Label>
                        <ul className="space-y-1.5">
                          {quotes.map((q) => (
                            <li
                              key={q.id}
                              className="flex flex-wrap items-center gap-2 text-xs"
                            >
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${
                                  q.status === "sent"
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                    : "bg-red-50 text-red-700 ring-red-600/20"
                                }`}
                              >
                                {q.status}
                              </span>
                              <span className="text-slate-700">
                                {q.quoteNo ? `${q.quoteNo} · ` : ""}
                                {q.subject}
                                {q.total !== undefined ? ` — ${money(q.total)}` : ""}
                              </span>
                              <span className="text-slate-400">
                                to {q.to} · by {q.sentBy} · {formatDate(q.sentAt)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {quoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Quotation for {quoteTarget.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Sent from your email ({user.email || "not configured"}) to{" "}
              {quoteTarget.email} · Subject: Quotation QT-… for{" "}
              {quoteTarget.name}
            </p>

            <div className="mt-4 space-y-2">
              {quoteLines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 p-2"
                >
                  <span
                    className={`col-span-2 rounded-full px-2 py-1 text-center text-xs font-semibold ${
                      line.type === "item"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {line.type === "item" ? "Product" : "Service"}
                  </span>
                  <input
                    className="col-span-4 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) =>
                      updateLine(line.id, { description: e.target.value })
                    }
                  />
                  <input
                    className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-brand-500 focus:outline-none"
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={line.qty || ""}
                    onChange={(e) =>
                      updateLine(line.id, { qty: Number(e.target.value) })
                    }
                  />
                  <input
                    className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-brand-500 focus:outline-none"
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={line.price || ""}
                    onChange={(e) =>
                      updateLine(line.id, { price: Number(e.target.value) })
                    }
                  />
                  <span className="col-span-1 text-right text-sm text-slate-700">
                    {money((Number(line.qty) || 0) * (Number(line.price) || 0))}
                  </span>
                  <button
                    type="button"
                    className="col-span-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                    onClick={() => removeLine(line.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {catalog && (
                  <>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
                      value=""
                      onChange={addFromProducts}
                    >
                      <option value="">Add product…</option>
                      {catalog.products.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
                      value=""
                      onChange={addFromServices}
                    >
                      <option value="">Add service…</option>
                      {catalog.services.map((s) => (
                        <option key={s.title} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <GhostButton type="button" onClick={() => addLine("item")}>
                  + Add item
                </GhostButton>
                <GhostButton type="button" onClick={() => addLine("service")}>
                  + Add service
                </GhostButton>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="w-40">
                <Label>VAT rate (%)</Label>
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  type="number"
                  min="0"
                  max="100"
                  value={quoteVatRate}
                  onChange={(e) => setQuoteVatRate(e.target.value)}
                />
              </div>
              <div className="space-y-1 text-right text-sm">
                <p className="text-slate-600">
                  Subtotal: <span className="font-medium">{money(subtotal)}</span>
                </p>
                <p className="text-slate-600">
                  VAT ({effectiveVatRate}%):{" "}
                  <span className="font-medium">{money(vat)}</span>
                </p>
                <p className="text-base font-bold text-slate-900">
                  Grand Total: {money(grandTotal)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                label="Notes (optional)"
                rows={3}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Terms, delivery info, validity, etc."
              />
            </div>

            {quoteStatus && (
              <p className="mt-3 text-sm text-slate-600">{quoteStatus}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton
                type="button"
                onClick={() => setQuoteTarget(null)}
                disabled={sending}
              >
                Cancel
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={sendQuote}
                disabled={sending}
              >
                {sending ? "Sending…" : "Send quote"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
