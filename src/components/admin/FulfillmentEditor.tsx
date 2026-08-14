"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/adminApi";
import type { AdminRole } from "@/lib/admin";
import type {
  FulfillmentOrder,
  FulfillmentStatus,
  OrderType,
} from "@/lib/fulfillment";
import type { PaymentStatus } from "@/lib/payment";
import { paidTotal, paymentStatus, remaining } from "@/lib/payment";
import {
  defaultBillBhuktaniBody,
  renderBillBhuktaniHtml,
  type BankDetails,
} from "@/lib/billBhuktani";
import { bsDateNepali, signatureName } from "@/lib/quotation";
import type { SiteContent } from "@/lib/data";
import { GhostButton, Input, Label, PrimaryButton, Textarea } from "./ui";

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

const METHOD_LABELS: Record<string, string> = {
  bank: "Bank Transfer",
  cash: "Cash",
  online: "Online Payment",
  transfer: "Offline Transfer",
};

const FILTERS: {
  id: string;
  label: string;
  match: (o: FulfillmentOrder) => boolean;
}[] = [
  {
    id: "active",
    label: "Active",
    match: (o) => o.status === "new" || o.status === "preparing" || o.status === "ready",
  },
  { id: "all", label: "All", match: () => true },
  {
    id: "delivered",
    label: "Delivered",
    match: (o) => o.status === "delivered",
  },
  {
    id: "payment",
    label: "Awaiting payment",
    match: (o) => !!o.billNo && paymentStatus(o) !== "received",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    match: (o) => o.status === "cancelled",
  },
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

function actionsFor(
  role: AdminRole,
  username: string,
  o: FulfillmentOrder
): Action[] {
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
  if (role === "sales" || role === "saleshead") {
    if (o.status === "new" && o.createdBy === username)
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
  if (role === "sales" || role === "saleshead") return o.orderType === "pickup";
  return false;
}

export default function FulfillmentEditor({
  user,
  focusOrderId,
  onFocusHandled,
}: {
  user: {
    role: AdminRole;
    name?: string;
    username?: string;
    signatory?: string;
    designation?: string;
    signature?: string;
  };
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [orders, setOrders] = useState<FulfillmentOrder[] | null>(null);
  const [filter, setFilter] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<
    Record<string, { amount: string; note: string; method: string; ref: string }>
  >({});
  const [voiding, setVoiding] = useState<{
    orderId: string;
    index: number;
    amount: number;
  } | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidBillOrder, setVoidBillOrder] = useState<FulfillmentOrder | null>(
    null
  );
  const [voidBillReason, setVoidBillReason] = useState("");
  const [siteInfo, setSiteInfo] = useState<SiteContent | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusHandledRef = useRef(false);

  useEffect(() => {
    if (!focusOrderId) return;
    if (focusHandledRef.current) return;
    focusHandledRef.current = true;
    setFilter("all");
    setHighlightId(focusOrderId);
    onFocusHandled?.();
  }, [focusOrderId, onFocusHandled]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`order-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightId, orders]);

  const [bhuktiTarget, setBhuktiTarget] = useState<FulfillmentOrder | null>(
    null
  );
  const [bhuktiRecipient, setBhuktiRecipient] = useState("");
  const [bhuktiBody, setBhuktiBody] = useState("");
  const [bhuktiDate, setBhuktiDate] = useState("");
  const [bhuktiBank, setBhuktiBank] = useState<BankDetails>({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
  });
  const [bhuktiStatus, setBhuktiStatus] = useState("");
  const [bhuktiSending, setBhuktiSending] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankDetails[]>([]);
  const [bhuktiBankSel, setBhuktiBankSel] = useState("-1");

  useEffect(() => {
    apiGet<FulfillmentOrder[]>("fulfillment")
      .then(setOrders)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      );
    apiGet<SiteContent>("site")
      .then(setSiteInfo)
      .catch(() => setSiteInfo(null));
    apiGet<BankDetails[]>("bank-accounts")
      .then(setBankAccounts)
      .catch(() => setBankAccounts([]));
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

  function openBillBhuktani(o: FulfillmentOrder) {
    const initial = bankOptions[0];
    setBhuktiTarget(o);
    setBhuktiRecipient(
      [
        "श्री कार्यालय प्रमुख ज्यू,",
        o.customerName,
        o.customerCompany,
        o.customerAddress,
      ]
        .filter(Boolean)
        .join("\n")
    );
    setBhuktiBankSel(initial?.value ?? "-1");
    setBhuktiBank({
      accountName: initial?.bank.accountName ?? "",
      accountNumber: initial?.bank.accountNumber ?? "",
      bankName: initial?.bank.bankName ?? "",
      branch: initial?.bank.branch ?? "",
    });
    setBhuktiBody(
      defaultBillBhuktaniBody({
        companyName: siteInfo?.name ?? "TechBucket",
        customerName: o.customerName,
        customerOrganization: o.customerCompany,
        billNo: o.billNo ?? "",
        billDate: o.billedAt ? bsDateNepali(o.billedAt.slice(0, 10)) : undefined,
      })
    );
    setBhuktiDate(bsDateNepali());
    setBhuktiStatus("");
  }

  function previewBillBhuktani() {
    if (!bhuktiTarget) return;
    const companyName = siteInfo?.name ?? "TechBucket";
    const phones = siteInfo?.contact?.phones ?? [];
    const html = renderBillBhuktaniHtml({
      origin: window.location.origin,
      data: {
        recipient: bhuktiRecipient.trim(),
        body: bhuktiBody.trim(),
        signatory: signatureName(user.signatory, user.name),
        designation: user.designation,
        signatureSrc: user.signature
          ? `${window.location.origin}${user.signature}`
          : undefined,
        stampSrc: `${window.location.origin}/api/admin/stamp`,
        companyName,
        tagline: [
          siteInfo?.contact?.address ?? "",
          [
            siteInfo?.contact?.email ?? "",
            ...(siteInfo?.contact?.phones ?? []).map((p) => p.label),
          ]
            .filter(Boolean)
            .join(" · "),
          siteInfo?.contact?.vatNo
            ? `PAN/VAT: ${siteInfo.contact.vatNo}`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
        contactLine: phones.map((p) => p.label).join(" | "),
        date: bhuktiDate.trim(),
        bank: bhuktiBank,
      },
      letterhead: true,
    });
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      setBhuktiStatus("Allow pop-ups to preview the letter.");
    }
  }

  async function sendBillBhuktani() {
    if (!bhuktiTarget) return;
    if (!bhuktiTarget.customerEmail.trim()) {
      setBhuktiStatus("Failed: this customer has no email on the order.");
      return;
    }
    if (!bhuktiRecipient.trim()) {
      setBhuktiStatus("Failed: add the recipient address.");
      return;
    }
    if (!bhuktiBody.trim()) {
      setBhuktiStatus("Failed: letter body cannot be empty.");
      return;
    }
    if (!bhuktiBank.accountNumber.trim() || !bhuktiBank.bankName.trim()) {
      setBhuktiStatus("Failed: select a bank account first.");
      return;
    }
    setBhuktiSending(true);
    setBhuktiStatus("");
    try {
      const res = await fetch("/api/admin/send-bill-bhuktani", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: bhuktiTarget.id,
          recipient: bhuktiRecipient.trim(),
          body: bhuktiBody.trim(),
          date: bhuktiDate.trim(),
          bank: bhuktiBank,
        }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setBhuktiStatus("Letter sent to " + bhuktiTarget.customerEmail);
        setOrders(await apiGet<FulfillmentOrder[]>("fulfillment"));
        setTimeout(() => setBhuktiTarget(null), 1200);
      } else {
        setBhuktiStatus(`Failed: ${body.error || "could not send"}`);
      }
    } catch (e) {
      setBhuktiStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setBhuktiSending(false);
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

  async function recordPayment(o: FulfillmentOrder) {
    const entry = payments[o.id] ?? {
      amount: "",
      note: "",
      method: "",
      ref: "",
    };
    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    setBusy(o.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: o.id,
          action: "payment",
          amount,
          note: entry.note.trim() || undefined,
          method: entry.method.trim() || undefined,
          ref: entry.ref.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not record the payment.");
        return;
      }
      setPayments((prev) => ({
        ...prev,
        [o.id]: { amount: "", note: "", method: "", ref: "" },
      }));
      setOrders(await apiGet<FulfillmentOrder[]>("fulfillment"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function voidPayment(orderId: string, index: number) {
    const reason = voidReason.trim();
    if (!reason) {
      setError("Please enter a reason for voiding the payment.");
      return;
    }
    setBusy(orderId);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          action: "void-payment",
          index,
          reason,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not void the payment.");
        return;
      }
      setVoiding(null);
      setVoidReason("");
      setOrders(await apiGet<FulfillmentOrder[]>("fulfillment"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function voidBill(orderId: string) {
    const reason = voidBillReason.trim();
    if (!reason) {
      setError("Please enter a reason for voiding the bill.");
      return;
    }
    setBusy(orderId);
    setError(null);
    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          action: "void-bill",
          reason,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error || "Could not void the bill.");
        return;
      }
      setVoidBillOrder(null);
      setVoidBillReason("");
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
  const visible = (orders ?? []).filter((o) => activeFilter.match(o));

  const bankOptions: { value: string; bank: BankDetails }[] = (() => {
    const opts = bankAccounts.map((bank, i) => ({ value: `a${i}`, bank }));
    if (opts.length === 0 && siteInfo?.bank) {
      opts.push({ value: "default", bank: siteInfo.bank });
    }
    return opts;
  })();

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
            ? "No fulfillment orders yet. Sales can convert a sent quote or bill a priced product order directly here."
            : "No orders in this view."}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => {
            const actions = actionsFor(user.role, user.username ?? "", o);
            return (
              <li
                key={o.id}
                id={`order-${o.id}`}
                className={`rounded-xl border bg-white p-4 ${
                  highlightId === o.id
                    ? "border-brand-400 ring-2 ring-brand-300"
                    : "border-slate-200"
                }`}
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
                      {o.billNo && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PAYMENT_BADGE[paymentStatus(o)]}`}
                        >
                          {PAYMENT_LABELS[paymentStatus(o)]}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {o.quoteNo
                        ? `Quote ${o.quoteNo} · by `
                        : "Direct order · by "}
                      {o.createdByName} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  {(actions.length > 0 ||
                    ((user.role === "superadmin" || user.role === "sales" || user.role === "saleshead") &&
                      (o.billNo || o.status === "delivered"))) && (
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
                      {(user.role === "superadmin" || user.role === "sales" || user.role === "saleshead") &&
                        (o.billNo || o.status === "delivered") && (
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
                      {(user.role === "superadmin" || user.role === "sales" || user.role === "saleshead") &&
                        o.billNo && (
                          <button
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => openBillBhuktani(o)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-60"
                          >
                            Bill Bhuktani
                          </button>
                        )}
                      {user.role === "superadmin" && o.billNo && (
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => void setVoidBillOrder(o)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          Void bill
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

                {o.billNo && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">
                        Bill {o.billNo}
                        {o.paymentDueDate
                          ? ` · due ${o.paymentDueDate}`
                          : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        Paid {money(paidTotal(o))} of {money(o.total)} ·{" "}
                        remaining {money(remaining(o))}
                      </p>
                    </div>
                    {o.payments && o.payments.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {o.payments.map((p, i) => (
                          <li
                            key={i}
                            className={`text-xs ${
                              p.voided
                                ? "text-slate-400 line-through"
                                : "text-slate-500"
                            }`}
                          >
                            {money(p.amount)} received · {p.by} ·{" "}
                            {formatDate(p.at)}
                            {p.method ? ` · ${METHOD_LABELS[p.method] ?? p.method}` : ""}
                            {p.ref ? ` · ref ${p.ref}` : ""}
                            {p.note ? ` — ${p.note}` : ""}
                            {p.receiptNo && !p.voided &&
                              (user.role === "superadmin" ||
                                user.role === "logistics" || user.role === "sales" || user.role === "saleshead")  && (
                                <button
                                  type="button"
                                  className="ml-2 font-medium text-brand-600 hover:text-brand-700"
                                  onClick={() =>
                                    window.open(
                                      `/api/admin/receipt?id=${o.id}&index=${i}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  Receipt
                                </button>
                              )}
                            {p.voided &&
                              (p.voidReason
                                ? ` — VOIDED (${p.voidReason})`
                                : " — VOIDED")}
                            {!p.voided &&
                              (user.role === "superadmin" ||
                                user.role === "logistics") && (
                                <button
                                  type="button"
                                  className="ml-2 font-medium text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setVoiding({
                                      orderId: o.id,
                                      index: i,
                                      amount: p.amount,
                                    });
                                    setVoidReason("");
                                  }}
                                >
                                  Void
                                </button>
                              )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(user.role === "superadmin" || user.role === "logistics") &&
                      paymentStatus(o) !== "received" && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={payments[o.id]?.amount ?? ""}
                            onChange={(e) =>
                              setPayments((prev) => ({
                                ...prev,
                                [o.id]: {
                                  amount: e.target.value,
                                  note: prev[o.id]?.note ?? "",
                                  method: prev[o.id]?.method ?? "",
                                  ref: prev[o.id]?.ref ?? "",
                                },
                              }))
                            }
                            placeholder={`Amount (upto ${remaining(o)})`}
                            className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
                          />
                          <select
                            value={payments[o.id]?.method ?? ""}
                            onChange={(e) =>
                              setPayments((prev) => ({
                                ...prev,
                                [o.id]: {
                                  amount: prev[o.id]?.amount ?? "",
                                  note: prev[o.id]?.note ?? "",
                                  method: e.target.value,
                                  ref: prev[o.id]?.ref ?? "",
                                },
                              }))
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
                          >
                            <option value="">Method</option>
                            {Object.entries(METHOD_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={payments[o.id]?.ref ?? ""}
                            onChange={(e) =>
                              setPayments((prev) => ({
                                ...prev,
                                [o.id]: {
                                  amount: prev[o.id]?.amount ?? "",
                                  note: prev[o.id]?.note ?? "",
                                  method: prev[o.id]?.method ?? "",
                                  ref: e.target.value,
                                },
                              }))
                            }
                            placeholder="Reference (optional)"
                            className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={payments[o.id]?.note ?? ""}
                            onChange={(e) =>
                              setPayments((prev) => ({
                                ...prev,
                                [o.id]: {
                                  amount: prev[o.id]?.amount ?? "",
                                  note: e.target.value,
                                  method: prev[o.id]?.method ?? "",
                                  ref: prev[o.id]?.ref ?? "",
                                },
                              }))
                            }
                            placeholder="Note (optional)"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
                          />
                          <PrimaryButton
                            type="button"
                            disabled={busy === o.id}
                            onClick={() => void recordPayment(o)}
                          >
                            Record received
                          </PrimaryButton>
                        </div>
                      )}

                    {o.billBhuktani && o.billBhuktani.length > 0 && (
                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <Label>Bill bhuktani letters</Label>
                        <ul className="mt-1 space-y-1">
                          {o.billBhuktani.map((r) => (
                            <li
                              key={r.id}
                              className="flex flex-wrap items-center gap-2 text-xs"
                            >
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${
                                  r.status === "sent"
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                    : "bg-red-50 text-red-700 ring-red-600/20"
                                }`}
                              >
                                {r.status}
                              </span>
                              <span className="text-slate-700">
                                बिल भुक्तानी निवेदन —{" "}
                                {r.recipient.split("\n")[0]}
                              </span>
                              <span className="text-slate-400">
                                to {r.sentTo} · by {r.sentBy} ·{" "}
                                {formatDate(r.sentAt)}
                              </span>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                onClick={() =>
                                  window.open(
                                    `/api/admin/bill-bhuktani?id=${r.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                Print
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
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
                          ) : e.action === "payment" ? (
                            <>
                              <span className="font-medium text-sky-700">
                                Payment {money(e.amount ?? 0)} received
                              </span>{" "}
                              · {e.by} · {formatDate(e.at)}
                              {e.note ? ` — ${e.note}` : ""}
                            </>
                          ) : e.action === "void" ? (
                            <>
                              <span className="font-medium text-red-600">
                                Voted payment
                              </span>{" "}
                              · {e.by} · {formatDate(e.at)}
                              {e.note ? ` — ${e.note}` : ""}
                            </>
                          ) : e.action === "void-bill" ? (
                            <>
                              <span className="font-medium text-red-600">
                                Voided bill
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

      {voiding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Void payment
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Void {money(voiding.amount)} from this bill? The amount will be
              removed from “received” and the receivable restored.
            </p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason (required)"
              rows={2}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => {
                  setVoiding(null);
                  setVoidReason("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === voiding.orderId}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                onClick={() => void voidPayment(voiding.orderId, voiding.index)}
              >
                Void payment
              </button>
            </div>
          </div>
        </div>
      )}

      {voidBillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Void bill</h3>
            <p className="mt-1 text-xs text-slate-500">
              Void bill {voidBillOrder.billNo} for{" "}
              {money(remaining(voidBillOrder))} remaining and remove it from
              receivables? The order will return to delivered and will need to
              be re-billed.
            </p>
            <textarea
              value={voidBillReason}
              onChange={(e) => setVoidBillReason(e.target.value)}
              placeholder="Reason (required)"
              rows={2}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => {
                  setVoidBillOrder(null);
                  setVoidBillReason("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === voidBillOrder.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                onClick={() => void voidBill(voidBillOrder.id)}
              >
                Void bill
              </button>
            </div>
          </div>
        </div>
      )}

      {bhuktiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Bill bhuktani letter — Bill {bhuktiTarget.billNo} for{" "}
              {bhuktiTarget.customerName}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              बिल भुक्तानी निवेदन — formal Nepali letter requesting payment of
              the issued bill. Date, subject, bill number, company name and
              contact are filled automatically. Signature comes from your
              profile; the bank account is selected below.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <Label>Bank account</Label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={bhuktiBankSel}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBhuktiBankSel(value);
                    const opt = bankOptions.find((o) => o.value === value);
                    setBhuktiBank({
                      accountName: opt?.bank.accountName ?? "",
                      accountNumber: opt?.bank.accountNumber ?? "",
                      bankName: opt?.bank.bankName ?? "",
                      branch: opt?.bank.branch ?? "",
                    });
                  }}
                >
                  <option value="-1" disabled>
                    — Select bank account —
                  </option>
                  {bankOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.bank.bankName} — {opt.bank.accountNumber}
                      {opt.bank.branch ? ` (${opt.bank.branch})` : ""}
                      {opt.bank.accountName ? ` · ${opt.bank.accountName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Textarea
                  label="Recipient (श्री, …)"
                  rows={4}
                  value={bhuktiRecipient}
                  onChange={(e) => setBhuktiRecipient(e.target.value)}
                  placeholder={"नेपाल सरकार\n… विभाग\nकाठमाडौँ, नेपाल ।"}
                />
              </div>

              <div>
                <Input
                  label="Date (मिति)"
                  value={bhuktiDate}
                  onChange={(e) => setBhuktiDate(e.target.value)}
                  placeholder="Auto-filled with today's B.S. date"
                />
              </div>

              <div>
                <Textarea
                  label="Letter body (निवेदन)"
                  rows={8}
                  value={bhuktiBody}
                  onChange={(e) => setBhuktiBody(e.target.value)}
                />
              </div>
            </div>

            {bhuktiStatus && (
              <p className="mt-3 text-sm text-slate-600">{bhuktiStatus}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton
                type="button"
                onClick={() => setBhuktiTarget(null)}
                disabled={bhuktiSending}
              >
                Cancel
              </GhostButton>
              <GhostButton
                type="button"
                onClick={previewBillBhuktani}
                disabled={bhuktiSending}
              >
                Preview / Print
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={sendBillBhuktani}
                disabled={bhuktiSending}
              >
                {bhuktiSending ? "Sending…" : "Send as email"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
