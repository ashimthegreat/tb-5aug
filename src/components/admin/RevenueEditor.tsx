"use client";

import { useCallback, useState } from "react";
import { PrimaryButton } from "./ui";

interface RevenueData {
  ok: boolean;
  bills: number;
  total: number;
  vat: number;
  received: number;
  receivable: number;
}

const money = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function RevenueEditor() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/revenue?${params}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not load revenue.");
        return;
      }
      setData(body);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const card =
    "rounded-xl border border-slate-200 bg-white p-4";
  const stat = (label: string, value: string) => (
    <div className={card}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Revenue report</h2>
        <p className="text-xs text-slate-500">
          Billed revenue, VAT, received amounts and receivables within a date
          range (based on bill date).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
        </label>
        <PrimaryButton type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : "Run report"}
        </PrimaryButton>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat("Billed (period)", money(data.total))}
          {stat("VAT included", money(data.vat))}
          {stat("Received", money(data.received))}
          {stat("Receivable", money(data.receivable))}
        </div>
      )}

      {data && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          Showing bill amounts for{" "}
          <span className="font-medium text-slate-700">{data.bills} bill(s)</span>
          {from || to
            ? ` • from ${from || "beginning"} to ${to || "today"}`
            : " (all time)"}
          .
        </div>
      )}
    </div>
  );
}