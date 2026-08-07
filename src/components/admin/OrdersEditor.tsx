"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import type { OrderRecord } from "@/lib/orders";
import type {
  FulfillmentOrder,
  FulfillmentStatus,
  OrderType,
} from "@/lib/fulfillment";

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

const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
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

const TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
};

const ACTIVE: FulfillmentStatus[] = ["new", "preparing", "ready"];

function FulfillmentSection({
  title,
  orders,
}: {
  title: string;
  orders: FulfillmentOrder[];
}) {
  if (orders.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">No orders in this view.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">
        {title} · {orders.length}
      </h3>
      <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
        {orders.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-start gap-2 border-b border-slate-100 py-3 text-sm last:border-0"
          >
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
              {TYPE_LABELS[o.orderType]}
            </span>
            {o.verifiedAt && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
                Verified ✓
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-slate-800"
                title={o.items
                  .map((it) => `${it.name} x${it.qty} — ${money(it.total)}`)
                  .join("\n")}
              >
                {o.items
                  .map((it) => `${it.name} x${it.qty} — ${money(it.total)}`)
                  .join(" · ")}
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                {formatDate(o.createdAt)} · {o.customerName} &lt;
                {o.customerEmail}&gt;{o.customerPhone ? ` · ${o.customerPhone}` : ""}
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                Quote {o.quoteNo} · by {o.createdByName}
                {o.updatedAt ? ` · updated ${formatDate(o.updatedAt)}` : ""}
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {money(o.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OrdersEditor() {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [fulfillment, setFulfillment] = useState<FulfillmentOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<OrderRecord[]>("orders"),
      apiGet<FulfillmentOrder[]>("fulfillment"),
    ])
      .then(([o, f]) => {
        setOrders(o);
        setFulfillment(f);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  const pending = (fulfillment ?? []).filter((o) => ACTIVE.includes(o.status));
  const completed = (fulfillment ?? []).filter(
    (o) => !ACTIVE.includes(o.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          Orders &amp; Requests
        </h2>
        <p className="text-xs text-slate-500">
          {fulfillment === null || orders === null
            ? "Loading…"
            : `${(fulfillment ?? []).length} fulfillment order${
                (fulfillment ?? []).length === 1 ? "" : "s"
              } · ${orders.length} record${orders.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <FulfillmentSection title="Pending orders" orders={pending} />
      <FulfillmentSection title="Completed orders" orders={completed} />

      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Quote requests &amp; public orders · {orders === null ? "…" : orders.length}
        </h3>
        {orders === null ? (
          <p className="mt-2 text-sm text-slate-500">Loading records…</p>
        ) : orders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No quote requests or orders yet.
          </p>
        ) : (
          <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
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
                  <span
                    className="block truncate text-slate-800"
                    title={o.items
                      .map((it) => `${it.name} x${it.qty} — ${money(it.total)}`)
                      .join("\n")}
                  >
                    {o.items
                      .map((it) => `${it.name} x${it.qty} — ${money(it.total)}`)
                      .join(" · ")}
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
    </div>
  );
}
