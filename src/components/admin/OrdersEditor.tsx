"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import type { OrderRecord } from "@/lib/orders";

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

export default function OrdersEditor() {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<OrderRecord[]>("orders")
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          Orders &amp; Requests
        </h2>
        <p className="text-xs text-slate-500">
          {orders === null ? "Loading…" : `${orders.length} record${orders.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {orders === null ? (
        <p className="mt-4 text-sm text-slate-500">Loading records…</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No quote requests or orders yet.
        </p>
      ) : (
        <ul className="mt-4 rounded-xl border border-slate-200 px-3 py-1">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-start gap-2 border-b border-slate-100 py-3 text-sm last:border-0"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  o.type === "order"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : "bg-amber-50 text-amber-700 ring-amber-600/20"
                }`}
              >
                {o.type === "order" ? "Order" : "Quote request"}
              </span>
              {o.type === "order" && o.channel && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {o.channel}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-slate-800" title={o.items.map((it) => `${it.name} x${it.qty} — ${money(it.total)}`).join("\n")}>
                  {o.items.map((it) => `${it.name} x${it.qty} — ${money(it.total)}`).join(" · ")}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {formatDate(o.createdAt)} · by {o.customerName} &lt;{o.email}
                  &gt;{o.phone ? ` · ${o.phone}` : ""}
                </span>
                {o.note && (
                  <span className="mt-1 block rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500">
                    {o.note}
                  </span>
                )}
              </span>
              {o.subtotal !== undefined && (
                <span className="text-sm font-semibold text-slate-800">
                  {money(o.subtotal)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
