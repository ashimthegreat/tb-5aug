"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import type { OrderRecord } from "@/lib/orders";
import type {
  FulfillmentOrder,
  FulfillmentStatus,
  OrderType,
} from "@/lib/fulfillment";
import type { PaymentStatus } from "@/lib/payment";
import { paymentStatus } from "@/lib/payment";
import type { AdminRole } from "@/lib/admin";
import {
  findCustomerLike,
  type CustomerLike,
} from "@/lib/customerMatch";
import { Label } from "./ui";

export interface CustomerDraft {
  name: string;
  email: string;
  phone?: string;
  note?: string;
  orderId?: string;
  orderItems?: { description: string; qty: number; price: number }[];
}

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

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  partial: "Payment partial",
  overdue: "Payment overdue",
  received: "Payment received",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  partial: "bg-sky-50 text-sky-700 ring-sky-600/20",
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  received: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
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
            {o.billNo && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PAYMENT_BADGE[paymentStatus(o)]}`}
              >
                {PAYMENT_LABELS[paymentStatus(o)]}
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
                {o.quoteNo ? `Quote ${o.quoteNo} · ` : "Direct order · "}by{" "}
                {o.createdByName}
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

function RequestList({
  records,
  busyId,
  canMark,
  customers,
  highlightId,
  onToggleQuoted,
  onAddCustomer,
  onSendQuote,
  onDirectBill,
}: {
  records: OrderRecord[];
  busyId: string | null;
  canMark: boolean;
  customers: CustomerLike[];
  highlightId?: string | null;
  onToggleQuoted: (o: OrderRecord) => void;
  onAddCustomer?: (draft: CustomerDraft) => void;
  onSendQuote?: (o: OrderRecord, customerId: string) => void;
  onDirectBill?: (o: OrderRecord) => void;
}) {
  if (records.length === 0) {
    return (
      <p className="mt-2 text-sm text-slate-500">No requests in this view.</p>
    );
  }
  const quoted = records.filter((o) => o.quoteStatus === "quoted").length;
  const billed = records.filter((o) => o.billNo).length;
  const isOrder = records[0]?.type === "order";
  return (
    <div>
      <p className="mt-1 text-xs text-slate-500">
        {isOrder
          ? `${billed} billed · ${records.length - billed} unbilled`
          : `${quoted} quoted · ${records.length - quoted} unquoted`}
      </p>
      <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
        {records.map((o, idx) => {
          const linked = o.customerId
            ? customers.find((c) => c.id === o.customerId) ?? null
            : findCustomerLike(customers, o.phone, o.email);
          return (
          <li
            key={o.id}
            id={`request-${o.id}`}
            className={`flex flex-wrap items-start gap-2 border-b border-slate-100 py-3 text-sm last:border-0 ${
              highlightId === o.id
                ? "rounded-lg bg-brand-50 ring-2 ring-brand-300"
                : ""
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {idx + 1}
            </span>
            {o.type === "order" && o.channel && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {o.channel}
              </span>
            )}
            {linked && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                {linked.name}
              </span>
            )}
            {o.type === "order" ? (
              o.billNo ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Billed {o.billNo}
                </span>
              ) : null
            ) : (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  o.quoteStatus === "quoted"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : "bg-amber-50 text-amber-700 ring-amber-600/20"
                }`}
              >
                {o.quoteStatus === "quoted" ? "Quoted ✓" : "Unquoted"}
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
              {o.quoteStatus === "quoted" && o.quotedBy && (
                <span className="mt-1 block text-xs text-slate-400">
                  Marked quoted by {o.quotedBy}
                  {o.quotedAt ? ` · ${formatDate(o.quotedAt)}` : ""}
                </span>
              )}
            </span>
            {o.subtotal !== undefined && (
              <span className="text-sm font-semibold text-slate-800">
                {money(o.subtotal)}
              </span>
            )}
            <span className="flex shrink-0 items-center gap-2">
              {o.type === "order" ? (
                <>
                  {o.fulfillmentOrderId && (
                    <button
                      type="button"
                      className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                      onClick={() =>
                        window.open(
                          `/api/admin/bill?id=${o.fulfillmentOrderId}`,
                          "_blank"
                        )
                      }
                    >
                      Bill {o.billNo} · Print
                    </button>
                  )}
                  {!o.fulfillmentOrderId && canMark && onDirectBill && (
                    <button
                      type="button"
                      className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      onClick={() => onDirectBill(o)}
                    >
                      Create order &amp; bill
                    </button>
                  )}
                </>
              ) : linked ? (
                <>
                  {onSendQuote && (
                    <button
                      type="button"
                      className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      onClick={() => onSendQuote(o, linked.id)}
                    >
                      Send quote
                    </button>
                  )}
                  {canMark && (
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => onToggleQuoted(o)}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                        o.quoteStatus === "quoted"
                          ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {busyId === o.id
                        ? "…"
                        : o.quoteStatus === "quoted"
                          ? "Mark pending"
                          : "Mark unquoted"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {onAddCustomer && (
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      onClick={() =>
                        onAddCustomer({
                          name: o.customerName,
                          email: o.email,
                          phone: o.phone,
                          note: o.note,
                          orderId: o.id,
                          orderItems: o.items.map((it) => ({
                            description: it.name,
                            qty: it.qty,
                            price: it.price,
                          })),
                        })
                      }
                    >
                      Add customer
                    </button>
                  )}
                  {canMark && (
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => onToggleQuoted(o)}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                        o.quoteStatus === "quoted"
                          ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {busyId === o.id
                        ? "…"
                        : o.quoteStatus === "quoted"
                          ? "Mark pending"
                          : "Mark unquoted"}
                    </button>
                  )}
                </>
              )}
            </span>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function OrdersEditor({
  user,
  onAddCustomer,
  onSendQuote,
  focusOrderId,
  onFocusHandled,
}: {
  user?: { name: string; role: AdminRole };
  onAddCustomer?: (draft: CustomerDraft) => void;
  onSendQuote?: (o: OrderRecord, customerId: string) => void;
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [customers, setCustomers] = useState<CustomerLike[] | null>(null);
  const [fulfillment, setFulfillment] = useState<FulfillmentOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const canMark = user?.role === "superadmin" || user?.role === "sales" || user?.role === "saleshead";

  const [directTarget, setDirectTarget] = useState<OrderRecord | null>(null);
  const [directOrderType, setDirectOrderType] = useState<OrderType>("delivery");
  const [directNotes, setDirectNotes] = useState("");
  const [directBusy, setDirectBusy] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusHandledRef = useRef(false);

  useEffect(() => {
    if (!focusOrderId) return;
    if (focusHandledRef.current) return;
    focusHandledRef.current = true;
    setHighlightId(focusOrderId);
    onFocusHandled?.();
  }, [focusOrderId, onFocusHandled]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`request-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightId, orders]);

const loadOrders = () =>
  apiGet<OrderRecord[]>("orders");

  useEffect(() => {
    Promise.all([
      loadOrders(),
      apiGet<FulfillmentOrder[]>("fulfillment"),
      apiGet<CustomerLike[]>("customers"),
    ])
      .then(([o, f, c]) => {
        setOrders(o);
        setFulfillment(f);
        setCustomers(c);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function toggleQuoted(o: OrderRecord) {
    setBusyId(o.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: o.id,
          quoteStatus: o.quoteStatus === "quoted" ? "pending" : "quoted",
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not update the request.");
        return;
      }
      await loadOrders();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function createDirectOrder() {
    if (!directTarget) return;
    setDirectBusy(true);
    setDirectError(null);
    try {
      const res = await fetch("/api/admin/orders/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: directTarget.id,
          orderType: directOrderType,
          notes: directNotes,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setDirectError(body.error || "Could not create the order.");
        return;
      }
      window.open(`/api/admin/bill?id=${body.order.id}`, "_blank");
      setDirectTarget(null);
      setDirectNotes("");
      setDirectOrderType("delivery");
      const [o, f] = await Promise.all([
        loadOrders(),
        apiGet<FulfillmentOrder[]>("fulfillment"),
      ]);
      setOrders(o);
      setFulfillment(f);
    } catch {
      setDirectError("Network error. Please try again.");
    } finally {
      setDirectBusy(false);
    }
  }

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

      {orders !== null && (
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Cart orders ·{" "}
            {orders.filter((o) => o.type === "order").length}
          </h3>
          <RequestList
            records={orders.filter((o) => o.type === "order")}
            busyId={busyId}
            canMark={canMark}
            customers={customers ?? []}
            highlightId={highlightId}
            onToggleQuoted={toggleQuoted}
            onAddCustomer={onAddCustomer}
            onSendQuote={onSendQuote}
            onDirectBill={setDirectTarget}
          />
        </div>
      )}

      {orders !== null && (
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Quote requests ·{" "}
            {orders.filter((o) => o.type === "quote-request").length}
          </h3>
          <RequestList
            records={orders.filter((o) => o.type === "quote-request")}
            busyId={busyId}
            canMark={canMark}
            customers={customers ?? []}
            highlightId={highlightId}
            onToggleQuoted={toggleQuoted}
            onAddCustomer={onAddCustomer}
            onSendQuote={onSendQuote}
          />
        </div>
      )}

      {directTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Create order &amp; bill
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Convert this priced product order directly into a fulfillment
              order with an immediate bill ({money(directTarget.subtotal ?? 0)})
              — no quote or quoted/unquoted marking needed.
            </p>
            <div className="mt-3">
              <Label>Order type</Label>
              <div className="mt-1 flex gap-2">
                {(["delivery", "pickup"] as OrderType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDirectOrderType(t)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      directOrderType === t
                        ? "bg-brand-600 text-white"
                        : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t === "delivery" ? "Delivery" : "Pickup"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <Label>Note (optional)</Label>
              <input
                type="text"
                value={directNotes}
                onChange={(e) => setDirectNotes(e.target.value)}
                placeholder="e.g. deliver to the office reception"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            {directError && (
              <p className="mt-3 text-sm text-red-600">{directError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={directBusy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                onClick={() => {
                  setDirectTarget(null);
                  setDirectNotes("");
                  setDirectError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={directBusy}
                onClick={() => void createDirectOrder()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {directBusy ? "Creating…" : "Create order & bill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
