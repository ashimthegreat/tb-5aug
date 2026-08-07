"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import type { AdminRole } from "@/lib/admin";
import type {
  FulfillmentOrder,
  FulfillmentStatus,
  OrderType,
} from "@/lib/fulfillment";
import { GhostButton, PrimaryButton } from "./ui";

const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
};

const STATUS_BADGE: Record<FulfillmentStatus, string> = {
  new: "bg-amber-50 text-amber-700 ring-amber-600/20",
  preparing: "bg-sky-50 text-sky-700 ring-sky-600/20",
  ready: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

const TYPE_BADGE: Record<OrderType, string> = {
  delivery: "bg-violet-50 text-violet-700 ring-violet-600/20",
  pickup: "bg-orange-50 text-orange-700 ring-orange-600/20",
};

const FILTERS: { id: string; label: string; match: (s: FulfillmentStatus) => boolean }[] = [
  { id: "active", label: "Active", match: (s) => s === "new" || s === "preparing" || s === "ready" },
  { id: "all", label: "All", match: () => true },
  { id: "delivered", label: "Delivered", match: (s) => s === "delivered" },
  { id: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
];

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

interface Action {
  to: FulfillmentStatus;
  label: string;
  style: "primary" | "ghost" | "danger";
}

function actionsFor(role: AdminRole, o: FulfillmentOrder): Action[] {
  if (role === "superadmin") {
    if (o.status === "new")
      return [
        { to: "preparing", label: "Start preparing", style: "primary" },
        { to: "cancelled", label: "Cancel", style: "danger" },
      ];
    if (o.status === "preparing")
      return [{ to: "ready", label: "Mark ready", style: "primary" }];
    if (o.status === "ready")
      return [
        {
          to: "delivered",
          label:
            o.orderType === "delivery"
              ? "Delivered to customer"
              : "Mark delivered",
          style: "primary",
        },
      ];
    return [];
  }
  if (role === "logistics") {
    if (o.status === "new")
      return [{ to: "preparing", label: "Start preparing", style: "primary" }];
    if (o.status === "preparing")
      return [{ to: "ready", label: "Mark ready", style: "primary" }];
    if (o.status === "ready" && o.orderType === "delivery" && o.verifiedAt)
      return [
        { to: "delivered", label: "Delivered to customer", style: "primary" },
      ];
    return [];
  }
  if (role === "sales") {
    if (o.status === "new")
      return [{ to: "cancelled", label: "Cancel", style: "danger" }];
    if (o.status === "ready" && o.orderType === "pickup" && o.verifiedAt)
      return [
        { to: "delivered", label: "Mark delivered / handed over", style: "primary" },
      ];
    return [];
  }
  return [];
}

function deliverable(role: AdminRole, o: FulfillmentOrder): boolean {
  if (role === "logistics") return o.orderType === "delivery";
  if (role === "sales") return o.orderType === "pickup";
  return false;
}

export default function FulfillmentEditor({
  user,
}: {
  user: { role: AdminRole };
}) {
  const [orders, setOrders] = useState<FulfillmentOrder[] | null>(null);
  const [filter, setFilter] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    apiGet<FulfillmentOrder[]>("fulfillment")
      .then(setOrders)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      );
  }, []);

  async function createBill(o: FulfillmentOrder) {
    setBusy(o.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: o.id }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not create the bill.");
        return;
      }
      window.open(`/api/admin/bill?id=${o.id}`, "_blank");
      setOrders(await apiGet<FulfillmentOrder[]>("fulfillment"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function verify(o: FulfillmentOrder) {
    const note = (verifyNotes[o.id] ?? "").trim();
    if (!note) {
      setError("Please add a verification note.");
      return;
    }
    setBusy(o.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: o.id, action: "verify", note }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not verify the order.");
        return;
      }
      setOrders(await apiGet<FulfillmentOrder[]>("fulfillment"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function transition(o: FulfillmentOrder, to: FulfillmentStatus) {
    setBusy(o.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: o.id, status: to }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not update the order.");
        return;
      }
      setOrders(await apiGet<FulfillmentOrder[]>("fulfillment"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const visible = (orders ?? []).filter((o) => activeFilter.match(o.status));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Fulfillment Orders
          </h3>
          {orders !== null && (
            <span className="text-xs text-slate-500">
              {orders.length} total
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {orders === null ? (
        <p className="text-sm text-slate-500">Loading orders…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          {filter === "active"
            ? "No fulfillment orders yet. When sales converts a sent quote to an order it will appear here."
            : "No orders in this view."}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => {
            const actions = actionsFor(user.role, o);
            return (
              <li
                key={o.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {o.orderNo}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[o.status]}`}
                      >
                        {STATUS_LABELS[o.status]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TYPE_BADGE[o.orderType]}`}
                      >
                        {ORDER_TYPE_LABELS[o.orderType]}
                      </span>
                      {o.verifiedAt && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
                          Verified ✓
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Quote {o.quoteNo} · by {o.createdByName} ·{" "}
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                  {(actions.length > 0 ||
                    ((user.role === "superadmin" || user.role === "sales") &&
                      o.status === "delivered")) && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {actions.map((a) =>
                        a.style === "primary" ? (
                          <PrimaryButton
                            key={a.to}
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => void transition(o, a.to)}
                          >
                            {a.label}
                          </PrimaryButton>
                        ) : a.style === "danger" ? (
                          <button
                            key={a.to}
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => void transition(o, a.to)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                          >
                            {a.label}
                          </button>
                        ) : (
                          <GhostButton
                            key={a.to}
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => void transition(o, a.to)}
                          >
                            {a.label}
                          </GhostButton>
                        )
                      )}
                      {(user.role === "superadmin" || user.role === "sales") &&
                        o.status === "delivered" && (
                          <button
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => void createBill(o)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                              o.billNo
                                ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {o.billNo
                              ? `Bill ${o.billNo} · Print`
                              : "Create bill"}
                          </button>
                        )}
                    </div>
                  )}
                </div>

                {user.role === "support" &&
                  o.status === "ready" &&
                  !o.verifiedAt && (
                    <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
                      <p className="text-sm font-semibold text-teal-900">
                        Verify prepared devices
                      </p>
                      <p className="mt-0.5 text-xs text-teal-700">
                        Confirm the devices are correct, then record your
                        verification. Sales is notified once verified.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={verifyNotes[o.id] ?? ""}
                          onChange={(e) =>
                            setVerifyNotes((prev) => ({
                              ...prev,
                              [o.id]: e.target.value,
                            }))
                          }
                          placeholder="Verification note (e.g. all 10 laptops tested)"
                          className="min-w-0 flex-1 rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                        />
                        <PrimaryButton
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => void verify(o)}
                        >
                          Verify & notify sales
                        </PrimaryButton>
                      </div>
                    </div>
                  )}

                {o.status === "ready" &&
                  !o.verifiedAt &&
                  deliverable(user.role, o) && (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      Awaiting support verification before this order can be
                      marked delivered.
                    </p>
                  )}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {o.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.customerEmail}
                      {o.customerPhone ? ` · ${o.customerPhone}` : ""}
                    </p>
                    {(o.customerCompany || o.customerAddress) && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {[o.customerCompany, o.customerAddress]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <ul className="space-y-0.5">
                      {o.items.map((it, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-600"
                        >
                          {it.name} x{it.qty} — {money(it.total)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-sm font-bold text-slate-900">
                      Total: {money(o.total)}
                    </p>
                  </div>
                </div>

                {o.notes && (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                    {o.notes}
                  </p>
                )}

                {o.verifiedAt && (
                  <p className="mt-2 rounded-lg bg-teal-50 px-2 py-1.5 text-xs text-teal-700">
                    Verified by {o.verifiedByName} · {formatDate(o.verifiedAt)}
                    {o.verifiedNote ? ` — ${o.verifiedNote}` : ""}
                  </p>
                )}

                {o.events.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      History
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {o.events.map((e, i) => (
                        <li key={i} className="text-xs text-slate-500">
                          {e.action === "verify" ? (
                            <>
                              <span className="font-medium text-teal-700">
                                Verified
                              </span>{" "}
                              · {e.by} · {formatDate(e.at)}
                              {e.note ? ` — ${e.note}` : ""}
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-slate-700">
                                {e.from === "—" ? "Created" : e.from}
                              </span>{" "}
                              →{" "}
                              <span className="font-medium text-slate-700">
                                {e.to}
                              </span>{" "}
                              · {e.by} · {formatDate(e.at)}
                              {e.note ? ` — ${e.note}` : ""}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
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
