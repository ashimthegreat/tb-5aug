"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import type { FulfillmentOrder } from "@/lib/fulfillment";
import {
  paidTotal,
  remaining,
  paymentStatus,
  daysPastDue,
  agingBucket,
} from "@/lib/payment";
import type { PaymentStatus, AgingBucket } from "@/lib/payment";
import { GhostButton } from "./ui";

interface LedgerRow {
  order: FulfillmentOrder;
  billNo: string;
  customer: string;
  customerCompany: string;
  date: string;
  dueDate: string;
  total: number;
  received: number;
  outstanding: number;
  statusKey: string;
  statusLabel: string;
  badge: string;
  bucket?: AgingBucket;
}

const BADGE: Record<string, string> = {
  received: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  partial: "bg-sky-50 text-sky-700 ring-sky-600/20",
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  unbilled: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

const STATUS_LABEL: Record<string, string> = {
  received: "Received",
  partial: "Partial",
  overdue: "Overdue",
  pending: "Pending",
  unbilled: "Not billed",
};

const AGING_LABELS: Record<AgingBucket, string> = {
  current: "Current (0–30 days)",
  "0-30": "1–30 days overdue",
  "31-60": "31–60 days overdue",
  "60+": "60+ days overdue",
};

const AGING_ORDER: AgingBucket[] = ["current", "0-30", "31-60", "60+"];

function money(n: number): string {
  return `Rs. ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function moneyNum(n: number): string {
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

export default function LedgerEditor() {
  const [orders, setOrders] = useState<FulfillmentOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<FulfillmentOrder[]>("fulfillment")
      .then(setOrders)
      .catch(() => setError("Could not load the ledger."));
  }, []);

  const rows = useMemo<LedgerRow[]>(() => {
    if (!orders) return [];
    const billed = orders.filter((o) => !!o.billNo && o.status !== "cancelled");
    const deliveredUnbilled = orders.filter(
      (o) => o.status === "delivered" && !o.billNo
    );
    const target = [...billed, ...deliveredUnbilled];
    return target
      .map((o) => {
        const isBilled = !!o.billNo;
        const ps = isBilled ? paymentStatus(o) : null;
        const statusKey = isBilled ? (ps as PaymentStatus) : "unbilled";
        return {
          order: o,
          billNo: isBilled ? (o.billNo as string) : "—",
          customer: o.customerName,
          customerCompany: o.customerCompany ?? "",
          date: isBilled ? formatDate(o.billedAt) : formatDate(o.createdAt),
          dueDate: o.paymentDueDate ? o.paymentDueDate : "—",
          total: o.total,
          received: isBilled ? paidTotal(o) : 0,
          outstanding: isBilled ? remaining(o) : 0,
          statusKey,
          statusLabel: STATUS_LABEL[statusKey],
          badge: BADGE[statusKey],
          bucket: isBilled ? agingBucket(o) : undefined,
        };
      })
      .sort((a, b) => (a.order.createdAt < b.order.createdAt ? 1 : -1));
  }, [orders]);

  const totals = useMemo(() => {
    const deliveredValue = rows.reduce((s, r) => s + r.order.total, 0);
    const received = rows.reduce((s, r) => s + r.received, 0);
    const receivable = rows.reduce((s, r) => s + r.outstanding, 0);
    const unbilledValue = rows
      .filter((r) => r.statusKey === "unbilled")
      .reduce((s, r) => s + r.order.total, 0);
    const activeValue = (orders ?? [])
      .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    const activeCount = (orders ?? []).filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled"
    ).length;
    const customersWithOutstanding = new Set(
      rows
        .filter((r) => r.statusKey !== "unbilled" && r.outstanding > 0)
        .map((r) => r.order.customerId)
    );
    const aging: Record<AgingBucket, { value: number; count: number }> = {
      current: { value: 0, count: 0 },
      "0-30": { value: 0, count: 0 },
      "31-60": { value: 0, count: 0 },
      "60+": { value: 0, count: 0 },
    };
    for (const r of rows) {
      if (r.statusKey === "unbilled") continue;
      const bucket = r.bucket ?? "current";
      aging[bucket].value += r.outstanding;
      aging[bucket].count += 1;
    }
    return {
      deliveredValue,
      received,
      receivable,
      unbilledValue,
      activeValue,
      activeCount,
      deliveredOrders: rows.length,
      customersWithOutstanding: customersWithOutstanding.size,
      aging,
    };
  }, [rows, orders]);

  const byCustomer = useMemo(() => {
    const map = new Map<string, LedgerRow[]>();
    for (const r of rows) {
      const key = r.order.customerId;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([id, list]) => ({
        id,
        name: list[0].customer,
        company: list[0].customerCompany,
        rows: list,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const downloadCsv = useCallback(() => {
    const header = [
      "Order No",
      "Bill No",
      "Customer",
      "Company",
      "Date",
      "Due Date",
      "Total",
      "Received",
      "Receivable",
      "Status",
      "Days Past Due",
    ];
    const lines = rows.map((r) => [
      r.order.orderNo,
      r.billNo,
      r.customer,
      r.customerCompany,
      r.date,
      r.dueDate,
      moneyNum(r.total),
      moneyNum(r.received),
      moneyNum(r.outstanding),
      r.statusLabel,
      r.bucket === undefined ? "0" : String(daysPastDue(r.order)),
    ]);
    const body = [header, ...lines]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [rows]);

  const [remindStatus, setRemindStatus] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const overdueCount = useMemo(
    () =>
      rows.filter(
        (r) => r.statusKey === "overdue" && r.outstanding > 0
      ).length,
    [rows]
  );

  const sendReminder = useCallback(async (mode: "internal" | "customer") => {
    setReminding(true);
    setRemindStatus(null);
    try {
      const res = await fetch(`/api/admin/overdue?mode=${mode}`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setRemindStatus(body.error || "Could not send reminders.");
        return;
      }
      if (mode === "customer") {
        setRemindStatus(
          body.dunned > 0
            ? `Payment reminder email sent to ${body.dunned} customer(s).`
            : "No customers had an email address; nothing sent."
        );
      } else {
        setRemindStatus(
          body.sent > 0
            ? `Reminder email sent to ${body.sent} recipient(s)` +
                " about overdue bills."
            : "No recipients were configured; nothing sent."
        );
      }
    } catch {
      setRemindStatus("Network error. Please try again.");
    } finally {
      setReminding(false);
    }
  }, []);

  const card =
    "rounded-xl border border-slate-200 bg-white p-4";
  const stat = (label: string, value: string, sub: string) => (
    <div className={card}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Customer Ledger & Receivables
          </h2>
          <p className="text-xs text-slate-500">
            Delivered sales, payments received, and amounts receivable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GhostButton
            type="button"
            onClick={() => void sendReminder("internal")}
            disabled={reminding || overdueCount === 0}
          >
            {reminding ? "Sending…" : "Email overdue reminders"}
          </GhostButton>
          <GhostButton
            type="button"
            onClick={() => void sendReminder("customer")}
            disabled={reminding || overdueCount === 0}
          >
            {reminding ? "Sending…" : "Email customers"}
          </GhostButton>
          <GhostButton
            type="button"
            onClick={downloadCsv}
            disabled={rows.length === 0}
          >
            Download CSV
          </GhostButton>
        </div>
      </div>

      {remindStatus && (
        <p className="mt-3 text-sm text-slate-600">{remindStatus}</p>
      )}

      {rows.length === 0 && !error ? (
        <p className="mt-6 text-sm text-slate-500">Loading orders…</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stat(
              "Delivered value",
              money(totals.deliveredValue),
              `${totals.deliveredOrders} delivered order${totals.deliveredOrders === 1 ? "" : "s"}`
            )}
            {stat("Payment received", money(totals.received), "collected so far")}
            {stat("Receivable", money(totals.receivable), "outstanding balance")}
            {stat(
              "In progress",
              money(totals.activeValue),
              `${totals.activeCount} not yet delivered`
            )}
            {stat(
              "Customers with balance",
              String(totals.customersWithOutstanding),
              "with partially/not paid billed orders"
            )}
          </div>

          {totals.unbilledValue > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Includes delivered-but-not-yet-billed orders amounting to{" "}
              <span className="font-semibold">{money(totals.unbilledValue)}</span>{" "}
              (shown as “Not billed”; they will become receivable once billed).
            </p>
          )}

          <div className="mt-5">
            <h3 className="text-sm font-bold text-slate-900">
              Receivable aging
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AGING_ORDER.map((b) => (
                <div key={b} className={card}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {AGING_LABELS[b]}
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      b === "60+"
                        ? "text-red-600"
                        : b === "31-60"
                          ? "text-orange-600"
                          : "text-slate-900"
                    }`}
                  >
                    {money(totals.aging[b].value)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {totals.aging[b].count} billed order
                    {totals.aging[b].count === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {byCustomer.map((c) => {
            const subReceived = c.rows.reduce((s, r) => s + r.received, 0);
            const subOutstanding = c.rows.reduce((s, r) => s + r.outstanding, 0);
            const subTotal = c.rows.reduce((s, r) => s + r.order.total, 0);
            return (
              <div key={c.id} className="mt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {c.name}
                    {c.company ? (
                      <span className="font-medium text-slate-400">
                        {" "}
                        · {c.company}
                      </span>
                    ) : null}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Value {money(subTotal)} · Received {money(subReceived)} ·
                    Receivable {money(subOutstanding)}
                  </span>
                </div>
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 font-semibold">Order</th>
                        <th className="px-3 py-2 font-semibold">Bill</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="px-3 py-2 font-semibold">Due</th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Total
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Received
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Receivable
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Days overdue
                        </th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.rows.map((r) => (
                        <tr
                          key={r.order.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            {r.order.orderNo}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {r.billNo}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{r.date}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {r.dueDate}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800">
                            {money(r.total)}
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-600">
                            {money(r.received)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">
                            {money(r.outstanding)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">
                            {r.bucket === undefined
                              ? "—"
                              : String(daysPastDue(r.order))}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${r.badge}`}
                            >
                              {r.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td
                          colSpan={4}
                          className="px-3 py-2 text-xs font-semibold text-slate-500"
                        >
                          Subtotal
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">
                          {money(subTotal)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">
                          {money(subReceived)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">
                          {money(subOutstanding)}
                        </td>
                        <td />
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}