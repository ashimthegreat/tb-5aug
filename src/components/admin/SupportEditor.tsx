"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import { Icon } from "@/components/icons";
import { DangerButton, GhostButton, Label, PrimaryButton, Select, fieldInput } from "./ui";

interface TicketReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNo: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  priority: string;
  product: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  replies: TicketReply[];
  createdAt: string;
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const statusBadge: Record<Ticket["status"], string> = {
  open: "bg-red-50 text-red-700 ring-red-600/20",
  "in-progress": "bg-amber-50 text-amber-700 ring-amber-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SupportEditor() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [status, setStatus] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    apiGet<Ticket[]>("support")
      .then(setTickets)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!tickets) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  const sorted = [...tickets].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  async function save() {
    setStatus("");
    try {
      await apiPut("support", tickets);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  function update(id: string, patch: Partial<Ticket>) {
    setTickets((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, ...patch } : t)) : prev
    );
  }

  function addReply(id: string) {
    const text = replyText.trim();
    if (!text || !tickets) return;
    update(id, {
      replies: [
        ...(tickets.find((t) => t.id === id)?.replies ?? []),
        {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          author: "Admin",
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setReplyText("");
  }

  function remove(id: string) {
    setTickets((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
    if (openId === id) setOpenId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Support tickets ({tickets.length})
        </h3>
        <div className="flex items-center gap-3">
          {status && <span className="text-sm text-slate-500">{status}</span>}
          <PrimaryButton type="button" onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No support tickets yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sorted.map((ticket) => {
            const open = openId === ticket.id;
            return (
              <li key={ticket.id} className="rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : ticket.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadge[ticket.status]}`}
                  >
                    {statusOptions.find((s) => s.value === ticket.status)?.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {ticket.ticketNo} · {ticket.subject}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {ticket.name} · {ticket.email} · {formatDate(ticket.createdAt)}
                    </span>
                  </span>
                  <Icon
                    name="arrow"
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
                  />
                </button>

                {open && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="text-sm">
                        <Label>Category</Label>
                        <p className="text-slate-700">{ticket.category}</p>
                      </div>
                      <div className="text-sm">
                        <Label>Priority</Label>
                        <p className="font-medium text-slate-700">{ticket.priority}</p>
                      </div>
                      <div className="text-sm">
                        <Label>Phone</Label>
                        <p className="text-slate-700">{ticket.phone || "—"}</p>
                      </div>
                      <div className="text-sm">
                        <Label>Product / order</Label>
                        <p className="text-slate-700">{ticket.product || "—"}</p>
                      </div>
                      <div className="text-sm sm:col-span-2">
                        <Label>Status</Label>
                        <Select
                          label=""
                          options={statusOptions}
                          value={ticket.status}
                          onChange={(e) =>
                            update(ticket.id, { status: e.target.value as Ticket["status"] })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                      <Label>Message</Label>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {ticket.message}
                      </p>
                    </div>

                    {ticket.replies.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label>Replies</Label>
                        {ticket.replies.map((r) => (
                          <div key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              {r.author} · {formatDate(r.createdAt)}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                              {r.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Add a reply / note…"
                        className={fieldInput}
                      />
                      <GhostButton type="button" onClick={() => addReply(ticket.id)}>
                        Add reply
                      </GhostButton>
                    </div>

                    <div className="mt-4">
                      <DangerButton type="button" onClick={() => remove(ticket.id)}>
                        Delete ticket
                      </DangerButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
