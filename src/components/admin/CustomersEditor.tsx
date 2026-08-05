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

interface Quote {
  id: string;
  to: string;
  subject: string;
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
  const [quoteSubject, setQuoteSubject] = useState("");
  const [quoteBody, setQuoteBody] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiGet<Customer[]>("customers")
      .then(setCustomers)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  function update(id: string, patch: Partial<Customer>) {
    setCustomers((prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, ...patch } : c)) : prev
    );
  }

  function addNew() {
    setCustomers((prev) =>
      prev ? [blankCustomer(user.username), ...prev] : [blankCustomer(user.username)]
    );
    setEditingId(blankCustomer(user.username).id);
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
    setQuoteSubject(`Quotation for ${c.name} — TechBucket`);
    setQuoteBody(
      [
        `Dear ${c.name},`,
        "",
        "Thank you for your interest in TechBucket. Please find our quotation below:",
        "",
        "[Item]  [Qty] x [Description] — NPR [price]",
        "",
        "This quotation is valid for 30 days. For any questions, contact us at info@techbucket.com.np.",
        "",
        "Regards,",
        user.email ? `${user.name} (${user.email})` : user.name,
        "TechBucket Pvt. Ltd.",
      ].join("\n")
    );
    setQuoteStatus("");
  }

  async function sendQuote() {
    if (!quoteTarget) return;
    if (!quoteTarget.email.trim()) {
      setQuoteStatus("Failed: add an email address for this customer first.");
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
          subject: quoteSubject,
          body: quoteBody,
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
                      <GhostButton
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setShowNew(false);
                        }}
                      >
                        Done
                      </GhostButton>
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
                              <span className="text-slate-700">{q.subject}</span>
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
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Send quote to {quoteTarget.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Sent from your email ({user.email || "not configured"}) to{" "}
              {quoteTarget.email}
            </p>
            <div className="mt-4 space-y-3">
              <Input
                label="Subject"
                value={quoteSubject}
                onChange={(e) => setQuoteSubject(e.target.value)}
              />
              <Textarea
                label="Message"
                rows={12}
                value={quoteBody}
                onChange={(e) => setQuoteBody(e.target.value)}
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
