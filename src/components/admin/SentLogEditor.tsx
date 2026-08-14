"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import { Label } from "./ui";
import type { SentLogEntry } from "@/lib/sentLog";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function money(n: number): string {
  return `NPR ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SentLogEditor() {
  const [entries, setEntries] = useState<SentLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<SentLogEntry[]>("sent-log")
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  const quotes = (entries ?? []).filter((e) => e.type === "quote");
  const suchidarta = (entries ?? []).filter((e) => e.type === "suchidarta");
  const bills = (entries ?? []).filter((e) => e.type === "bill");
  const billbhuktani = (entries ?? []).filter((e) => e.type === "billbhuktani");

  function renderRow(e: SentLogEntry) {
    const printUrl =
      e.type === "quote"
        ? `/api/admin/quotation?id=${e.id}`
        : e.type === "suchidarta"
          ? `/api/admin/suchidarta?id=${e.id}`
          : e.type === "bill"
            ? `/api/admin/bill?id=${e.id}`
            : `/api/admin/bill-bhuktani?id=${e.id}`;
    const title =
      e.type === "quote"
        ? e.quoteNo
          ? `Quotation ${e.quoteNo} — ${e.subject}`
          : e.subject
        : e.type === "suchidarta"
          ? `सुची दर्ता निवेदन — ${e.recipient.split("\n")[0]}`
          : e.type === "bill"
            ? `Bill ${e.billNo}${e.orderNo ? ` (${e.orderNo})` : ""}`
            : `बिल भुक्तानी निवेदन — ${e.recipient.split("\n")[0]}`;
    const to =
      e.type === "quote"
        ? e.to
        : e.type === "suchidarta" || e.type === "billbhuktani"
          ? e.sentTo
          : e.customerEmail;
    const badgeColor =
      e.type === "quote"
        ? "bg-blue-50 text-blue-700 ring-blue-600/20"
        : e.type === "suchidarta"
          ? "bg-violet-50 text-violet-700 ring-violet-600/20"
          : e.type === "bill"
            ? "bg-teal-50 text-teal-700 ring-teal-600/20"
            : "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
    const typeLabel =
      e.type === "quote"
        ? "Quote"
        : e.type === "suchidarta"
          ? "Suchidarta"
          : e.type === "bill"
            ? "Bill"
            : "Bill Bhuktani";
    return (
      <li
        key={`${e.type}-${e.id}`}
        className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2 text-sm last:border-0"
      >
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeColor}`}
        >
          {typeLabel}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
            e.status === "sent" || e.status === "issued"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-red-50 text-red-700 ring-red-600/20"
          }`}
        >
          {e.status}
        </span>
        <span className="min-w-0 flex-1 truncate text-slate-800" title={title}>
          {title}
          {(e.type === "quote" || e.type === "bill") && e.total !== undefined
            ? ` — ${money(e.total)}`
            : ""}
        </span>
        <span className="text-xs text-slate-500">
          {e.customerName}
          {e.customerEmail ? ` <${e.customerEmail}>` : ""}
        </span>
        <span className="text-xs text-slate-400">
          to {to} · by {e.type === "bill" ? e.billedBy : e.sentBy} ·{" "}
          {formatDate(e.type === "bill" ? e.billedAt : e.sentAt)}
        </span>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          onClick={() => window.open(printUrl, "_blank")}
        >
          Print
        </button>
      </li>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Sent log</h2>
        <p className="text-xs text-slate-500">
          {entries === null
            ? "Loading…"
            : `${quotes.length} quotes · ${suchidarta.length} suchidarta · ${bills.length} bills · ${billbhuktani.length} bill bhuktani`}
        </p>
      </div>

      {entries === null ? (
        <p className="mt-4 text-sm text-slate-500">Loading sent records…</p>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No quotes, suchidarta, bills, or bill bhuktani letters have been sent
          yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <Label>Sent quotes</Label>
            <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
              {quotes.length === 0 ? (
                <li className="py-2 text-xs text-slate-400">None</li>
              ) : (
                quotes.map(renderRow)
              )}
            </ul>
          </div>
          <div>
            <Label>Sent suchidarta</Label>
            <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
              {suchidarta.length === 0 ? (
                <li className="py-2 text-xs text-slate-400">None</li>
              ) : (
                suchidarta.map(renderRow)
              )}
            </ul>
          </div>
          <div>
            <Label>Issued bills</Label>
            <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
              {bills.length === 0 ? (
                <li className="py-2 text-xs text-slate-400">None</li>
              ) : (
                bills.map(renderRow)
              )}
            </ul>
          </div>
          <div>
            <Label>Sent bill bhuktani</Label>
            <ul className="mt-2 rounded-xl border border-slate-200 px-3 py-1">
              {billbhuktani.length === 0 ? (
                <li className="py-2 text-xs text-slate-400">None</li>
              ) : (
                billbhuktani.map(renderRow)
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
