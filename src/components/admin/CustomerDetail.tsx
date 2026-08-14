"use client";

import { useEffect, useState } from "react";
import type { CustomerDetail as CustomerDetailData } from "@/lib/customerDetail";
import { paymentStatus, paidTotal } from "@/lib/payment";
import { GhostButton, Label } from "./ui";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function money(n: number): string {
  return `Rs. ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-50 text-amber-700 ring-amber-600/20",
  preparing: "bg-sky-50 text-sky-700 ring-sky-600/20",
  ready: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

const TYPE_LABELS: Record<string, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Payment pending",
  partial: "Payment partial",
  overdue: "Payment overdue",
  received: "Payment received",
};

const PAYMENT_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  partial: "bg-sky-50 text-sky-700 ring-sky-600/20",
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  received: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

const TICKET_LABELS: Record<string, string> = {
  open: "Open",
  "in-progress": "In progress",
  resolved: "Resolved",
};

const TICKET_BADGE: Record<string, string> = {
  open: "bg-red-50 text-red-700 ring-red-600/20",
  "in-progress": "bg-amber-50 text-amber-700 ring-amber-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

function Section({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <h4 className="text-sm font-bold text-slate-900">
        {title}
        {count !== undefined ? ` · ${count}` : ""}
      </h4>
    </div>
  );
}

function EmptyRow() {
  return <p className="mt-1 text-xs text-slate-400">None</p>;
}

function Badge({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {text}
    </span>
  );
}

function PrintButton({ href, label }: { href: string; label: string }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600 transition-colors hover:bg-slate-50"
      onClick={() => window.open(href, "_blank")}
    >
      {label}
    </button>
  );
}

export default function CustomerDetail({
  customerId,
  onClose,
  onJumpTo,
}: {
  customerId: string;
  onClose: () => void;
  onJumpTo: (tab: "fulfillment" | "orders", id: string) => void;
}) {
  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/customer?id=${encodeURIComponent(customerId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load customer");
        if (alive) setData(body.data as CustomerDetailData);
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      });
    return () => {
      alive = false;
    };
  }, [customerId]);

  const c = data?.customer;
  const s = data?.summary;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto my-6 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">
              {c ? c.name || "Untitled customer" : "Customer"}
            </h3>
            {c && (
              <p className="mt-0.5 text-xs text-slate-500">
                {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact"}
                {c.createdBy ? ` · added by ${c.createdBy}` : ""}
                {c.createdAt ? ` · ${formatDate(c.createdAt)}` : ""}
              </p>
            )}
          </div>
          <GhostButton type="button" onClick={onClose}>
            Close
          </GhostButton>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!data && !error && (
          <p className="mt-6 text-sm text-slate-500">Loading customer…</p>
        )}

        {data && c && s && (
          <>
            {(c.company || c.address) && (
              <p className="mt-2 text-xs text-slate-500">
                {[c.company, c.address].filter(Boolean).join(" · ")}
              </p>
            )}
            {c.notes && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                {c.notes}
              </p>
            )}
            {s.lastActivity && (
              <p className="mt-2 text-xs text-slate-400">
                Last activity: {formatDate(s.lastActivity)}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Lifetime billed
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {money(s.billed)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Paid
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-600">
                  {money(s.paid)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Outstanding
                </p>
                <p className="mt-1 text-lg font-bold text-red-600">
                  {money(s.outstanding)}
                </p>
                {s.overdueBills > 0 && (
                  <p className="text-xs font-medium text-red-500">
                    {s.overdueBills} overdue bill{s.overdueBills === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Orders
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {s.activeOrders} active
                </p>
                <p className="text-xs text-slate-500">
                  {s.deliveredOrders} delivered · {s.cancelledOrders} cancelled
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Quotes
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {s.quotesSent}
                </p>
                <p className="text-xs text-slate-500">
                  {s.quotesFailed} failed
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Letters
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {s.suchidarta + s.billBhuktani}
                </p>
                <p className="text-xs text-slate-500">
                  {s.suchidarta} suchidarta · {s.billBhuktani} bill bhuktani
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Site requests
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {s.siteRequests}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Support tickets
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {s.tickets}
                </p>
                <p className="text-xs text-slate-500">{s.openTickets} open</p>
              </div>
            </div>

            <Section title="Quotes" count={data.quotes.length} />
            {data.quotes.length === 0 ? (
              <EmptyRow />
            ) : (
              <ul className="mt-1 space-y-1.5">
                {data.quotes.map((q) => (
                  <li
                    key={q.id}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    <Badge
                      text={q.status}
                      className={
                        q.status === "sent"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-red-50 text-red-700 ring-red-600/20"
                      }
                    />
                    <span className="text-slate-700">
                      {q.quoteNo ? `${q.quoteNo} · ` : ""}
                      {q.subject}
                      {q.total !== undefined ? ` — ${money(q.total)}` : ""}
                    </span>
                    <span className="text-slate-400">
                      to {q.to} · by {q.sentBy} · {formatDate(q.sentAt)}
                    </span>
                    {data.fulfillment.some((o) => o.quoteId === q.id) && (
                      <Badge
                        text="Order placed"
                        className="bg-slate-100 text-slate-500 ring-slate-400/20"
                      />
                    )}
                    <PrintButton
                      href={`/api/admin/quotation?id=${q.id}`}
                      label="Print"
                    />
                  </li>
                ))}
              </ul>
            )}

            <Section title="Suchidarta" count={data.suchidarta.length} />
            {data.suchidarta.length === 0 ? (
              <EmptyRow />
            ) : (
              <ul className="mt-1 space-y-1.5">
                {data.suchidarta.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    <Badge
                      text={r.status}
                      className={
                        r.status === "sent"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-red-50 text-red-700 ring-red-600/20"
                      }
                    />
                    <span className="text-slate-700">
                      सुची दर्ता निवेदन — {r.recipient.split("\n")[0]}
                    </span>
                    <span className="text-slate-400">
                      to {r.sentTo} · by {r.sentBy} · {formatDate(r.sentAt)}
                    </span>
                    <PrintButton
                      href={`/api/admin/suchidarta?id=${r.id}`}
                      label="Print"
                    />
                  </li>
                ))}
              </ul>
            )}

            <Section title="Site requests" count={data.siteRequests.length} />
            {data.siteRequests.length === 0 ? (
              <EmptyRow />
            ) : (
              <ul className="mt-1 space-y-1.5">
                {data.siteRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    <Badge
                      text={r.type === "order" ? "Cart order" : "Quote request"}
                      className="bg-slate-100 text-slate-600 ring-slate-400/20"
                    />
                    <Badge
                      text={r.quoteStatus === "quoted" ? "Quoted ✓" : "Unquoted"}
                      className={
                        r.quoteStatus === "quoted"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-amber-50 text-amber-700 ring-amber-600/20"
                      }
                    />
                    <span className="min-w-0 flex-1 text-slate-700">
                      {r.items
                        .map((it) => `${it.name} x${it.qty}`)
                        .join(" · ")}
                      {r.subtotal !== undefined
                        ? ` — ${money(r.subtotal)}`
                        : ""}
                    </span>
                    <span className="text-slate-400">
                      {formatDate(r.createdAt)}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                      onClick={() => onJumpTo("orders", r.id)}
                    >
                      Open in Orders
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Section title="Fulfillment orders" count={data.fulfillment.length} />
            {data.fulfillment.length === 0 ? (
              <EmptyRow />
            ) : (
              <ul className="mt-1 space-y-2">
                {data.fulfillment.map((o) => {
                  const ps = paymentStatus(o);
                  const paid = paidTotal(o);
                  return (
                    <li
                      key={o.id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-sm font-bold text-slate-900">
                          {o.orderNo}
                        </span>
                        <Badge
                          text={STATUS_LABELS[o.status]}
                          className={STATUS_BADGE[o.status]}
                        />
                        <Badge
                          text={TYPE_LABELS[o.orderType]}
                          className="bg-violet-50 text-violet-700 ring-violet-600/20"
                        />
                        {o.billNo && (
                          <Badge
                            text={PAYMENT_LABELS[ps]}
                            className={PAYMENT_BADGE[ps]}
                          />
                        )}
                        {o.verifiedAt && (
                          <Badge
                            text="Verified ✓"
                            className="bg-teal-50 text-teal-700 ring-teal-600/20"
                          />
                        )}
                        <span className="min-w-0 flex-1 text-slate-700">
                          {o.items
                            .map(
                              (it) =>
                                `${it.name} x${it.qty} — ${money(it.total)}`
                            )
                            .join(" · ")}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {money(o.total)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          Created {formatDate(o.createdAt)} ·{" "}
                          {o.quoteNo
                            ? `quote ${o.quoteNo} · `
                            : "direct order · "}
                          {o.createdByName}
                        </span>
                        {o.billNo && (
                          <>
                            <Badge
                              text={`Bill ${o.billNo}`}
                              className="bg-slate-100 text-slate-600 ring-slate-400/20"
                            />
                            <span>
                              Paid {money(paid)} of {money(o.total)}
                            </span>
                          </>
                        )}
                      </div>

                      {o.payments && o.payments.length > 0 && (
                        <div className="mt-2">
                          <Label>Payments</Label>
                          <ul className="mt-1 space-y-1">
                            {o.payments.map((p, i) => (
                              <li
                                key={i}
                                className="flex flex-wrap items-center gap-2 text-xs"
                              >
                                {p.voided ? (
                                  <Badge
                                    text="Voided"
                                    className="bg-slate-100 text-slate-500 ring-slate-400/20"
                                  />
                                ) : (
                                  <Badge
                                    text="Payment"
                                    className="bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                  />
                                )}
                                <span className="text-slate-700">
                                  {money(p.amount)}
                                </span>
                                <span className="text-slate-400">
                                  {p.method ?? "—"} · {p.by} ·{" "}
                                  {formatDate(p.at)}
                                </span>
                                {p.receiptNo && !p.voided && (
                                  <>
                                    <span className="text-slate-400">
                                      {p.receiptNo}
                                    </span>
                                    <PrintButton
                                      href={`/api/admin/receipt?id=${o.id}&index=${i}`}
                                      label="Receipt"
                                    />
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {o.billBhuktani && o.billBhuktani.length > 0 && (
                        <div className="mt-2">
                          <Label>Bill bhuktani letters</Label>
                          <ul className="mt-1 space-y-1">
                            {o.billBhuktani.map((r) => (
                              <li
                                key={r.id}
                                className="flex flex-wrap items-center gap-2 text-xs"
                              >
                                <Badge
                                  text={r.status}
                                  className={
                                    r.status === "sent"
                                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                      : "bg-red-50 text-red-700 ring-red-600/20"
                                  }
                                />
                                <span className="text-slate-700">
                                  बिल भुक्तानी निवेदन —{" "}
                                  {r.recipient.split("\n")[0]}
                                </span>
                                <span className="text-slate-400">
                                  to {r.sentTo} · {formatDate(r.sentAt)}
                                </span>
                                <PrintButton
                                  href={`/api/admin/bill-bhuktani?id=${r.id}`}
                                  label="Print"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        {o.billNo && (
                          <PrintButton
                            href={`/api/admin/bill?id=${o.id}`}
                            label="Print bill"
                          />
                        )}
                        <button
                          type="button"
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                          onClick={() => onJumpTo("fulfillment", o.id)}
                        >
                          Open in Fulfillment
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <Section title="Support tickets" count={data.tickets.length} />
            {data.tickets.length === 0 ? (
              <EmptyRow />
            ) : (
              <ul className="mt-1 space-y-1.5">
                {data.tickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-2 text-xs"
                  >
                    <Badge
                      text={TICKET_LABELS[t.status] ?? t.status}
                      className={TICKET_BADGE[t.status] ?? ""}
                    />
                    <span className="text-slate-700">
                      {t.ticketNo ? `${t.ticketNo} · ` : ""}
                      {t.subject}
                    </span>
                    <span className="text-slate-400">
                      {t.name} · {t.email} · {formatDate(t.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
