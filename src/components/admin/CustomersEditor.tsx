"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import {
  bsDateNepali,
  renderQuotationHtml,
  quoteDate,
  signatureName,
  validUntil,
  type QuotationLine,
  type QuotationParty,
} from "@/lib/quotation";
import {
  defaultSuchidartaBody,
  letterContactLine,
  renderSuchidartaHtml,
} from "@/lib/suchidarta";
import {
  DangerButton,
  GhostButton,
  Input,
  Label,
  PrimaryButton,
  Textarea,
} from "./ui";
import SearchablePicker from "./SearchablePicker";
import CustomerDetail from "./CustomerDetail";
import type { FulfillmentOrder, OrderType } from "@/lib/fulfillment";
import type { QuotePrefill, PrefillQuoteItem } from "@/lib/customerMatch";

interface CustomerDraftLike {
  name: string;
  email: string;
  phone?: string;
  note?: string;
  orderId?: string;
}

interface Catalog {
  products: { name: string; price: number }[];
  services: { title: string }[];
  discounts?: { id: string; name: string; percent: number }[];
  company?: {
    name: string;
    signatory?: string;
    email: string;
    address: string;
    phones: string[];
    vatNo: string;
  };
}

interface QuoteLine {
  id: string;
  type: "item" | "service";
  description: string;
  qty: number;
  price: number;
}

interface Quote {
  id: string;
  quoteNo?: string;
  to: string;
  subject: string;
  items?: QuoteLine[];
  vatRate?: number;
  subtotal?: number;
  vat?: number;
  total?: number;
  notes?: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  quotes?: Quote[];
  suchidarta?: SuchidartaRecord[];
}

interface SuchidartaRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  signatory: string;
  sentTo: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
}

function blankQuoteLine(type: "item" | "service"): QuoteLine {
  return { id: crypto.randomUUID(), type, description: "", qty: 1, price: 0 };
}

function prefillQuoteLines(items: PrefillQuoteItem[]): QuoteLine[] {
  return items.map((it) => ({
    id: crypto.randomUUID(),
    type: "item",
    description: it.description.trim(),
    qty: Math.max(1, Number(it.qty) || 1),
    price:
      Number(it.price) > 0 ? round2(Number(it.price) / 1.13) : 0,
  }));
}

function money(n: number): string {
  return `NPR ${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Delivery to customer",
  pickup: "Pickup / handover to sales",
};

function blankCustomer(createdBy: string): Customer {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
    createdBy,
    createdAt: new Date().toISOString(),
    quotes: [],
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CustomersEditor({
  user,
  initialDraft,
  onDraftHandled,
  quotePrefill,
  onQuotePrefillHandled,
  onJumpTo,
}: {
  user: { name: string; username: string; email?: string; signatory?: string; designation?: string; signature?: string };
  initialDraft?: CustomerDraftLike | null;
  onDraftHandled?: () => void;
  quotePrefill?: QuotePrefill | null;
  onQuotePrefillHandled?: () => void;
  onJumpTo?: (tab: "fulfillment" | "orders", id: string) => void;
}) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [status, setStatus] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [quoteTarget, setQuoteTarget] = useState<Customer | null>(null);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([]);
  const [quoteVatRate, setQuoteVatRate] = useState("13");
  const [quoteDiscountId, setQuoteDiscountId] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteSpecs, setQuoteSpecs] = useState("");
  const [quoteTerms, setQuoteTerms] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [quoteOrderId, setQuoteOrderId] = useState<string | null>(null);

  const [suchiTarget, setSuchiTarget] = useState<Customer | null>(null);
  const [suchiRecipient, setSuchiRecipient] = useState("");
  const [suchiBody, setSuchiBody] = useState("");
  const [suchiDate, setSuchiDate] = useState("");
  const [suchiStatus, setSuchiStatus] = useState("");
  const [suchiSending, setSuchiSending] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);

  const [converted, setConverted] = useState<Record<string, string>>({});
  const [orderTarget, setOrderTarget] = useState<{
    customer: Customer;
    quote: Quote;
  } | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [orderNote, setOrderNote] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSending, setOrderSending] = useState(false);

  const draftRef = useRef(initialDraft);
  const onDraftHandledRef = useRef(onDraftHandled);
  const usernameRef = useRef(user.username);
  const fetchedOnceRef = useRef(false);
  const quotePrefillRef = useRef(quotePrefill);
  const onQuotePrefillHandledRef = useRef(onQuotePrefillHandled);
  const pendingOrderRef = useRef<{
    orderId: string;
    items: PrefillQuoteItem[];
    draftId: string;
  } | null>(null);
  useEffect(() => {
    onDraftHandledRef.current = onDraftHandled;
    onQuotePrefillHandledRef.current = onQuotePrefillHandled;
    usernameRef.current = user.username;
    if (quotePrefill) quotePrefillRef.current = quotePrefill;
  }, [onDraftHandled, onQuotePrefillHandled, user.username, quotePrefill]);

  useEffect(() => {
    if (fetchedOnceRef.current) return;
    fetchedOnceRef.current = true;
    apiGet<Customer[]>("customers")
      .then((list) => {
        const draft = draftRef.current;
        let blankId: string | null = null;
        if (draft) {
          draftRef.current = null;
          const blank = blankCustomer(usernameRef.current);
          blank.name = draft.name ?? "";
          blank.email = draft.email ?? "";
          blank.phone = draft.phone ?? "";
          blank.notes = draft.note ?? "";
          blankId = blank.id;
          setCustomers([blank, ...list]);
          setEditingId(blank.id);
          setShowNew(true);
          setStatus("New customer pre-filled from request — review and save.");
          onDraftHandledRef.current?.();
        } else {
          setCustomers(list);
        }
        const prefill = quotePrefillRef.current;
        if (prefill?.orderId && blankId) {
          quotePrefillRef.current = null;
          onQuotePrefillHandledRef.current?.();
          pendingOrderRef.current = {
            orderId: prefill.orderId,
            items: prefill.items,
            draftId: blankId,
          };
        }
      })
      .catch((e) => setStatus(`Error: ${e.message}`));
    apiGet<Catalog>("catalog")
      .then(setCatalog)
      .catch(() => setCatalog(null));
    apiGet<FulfillmentOrder[]>("fulfillment")
      .then((list) => {
        const map: Record<string, string> = {};
        for (const o of list) {
          if (o.quoteId) map[o.quoteId] = o.orderNo;
        }
        setConverted(map);
      })
      .catch(() => {});
  }, []);

  function update(id: string, patch: Partial<Customer>) {
    setCustomers((prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, ...patch } : c)) : prev
    );
  }

  function addNew() {
    const blank = blankCustomer(user.username);
    setCustomers((prev) =>
      prev ? [blank, ...prev] : [blank]
    );
    setEditingId(blank.id);
    setShowNew(true);
    setStatus("");
  }

  function remove(id: string) {
    setCustomers((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    if (editingId === id) {
      setEditingId(null);
      setShowNew(false);
    }
  }

  async function save() {
    if (!customers) return;
    const cleaned = customers.filter((c) => c.name.trim() || c.email.trim());
    setStatus("");
    try {
      await apiPut("customers", cleaned);
      setStatus("Saved");
      await completePendingOrder();
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  async function completePendingOrder() {
    const pending = pendingOrderRef.current;
    if (!pending) return;
    pendingOrderRef.current = null;
    const customer = customers?.find((c) => c.id === pending.draftId);
    if (!customer) return;
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pending.orderId, customerId: pending.draftId }),
      });
    } catch {
      // Linking is best-effort; quoting can continue regardless.
    }
    openQuoteWithItems(customer, pending.orderId, pending.items);
  }

  function openQuote(c: Customer) {
    setQuoteTarget(c);
    setQuoteLines([blankQuoteLine("item")]);
    setQuoteOrderId(null);
    setQuoteVatRate("13");
    setQuoteDiscountId("");
    setQuoteNotes("");
    setQuoteSpecs("");
    setQuoteTerms("");
    setQuoteStatus("");
  }

  function openQuoteWithItems(
    c: Customer,
    orderId: string | undefined,
    items: PrefillQuoteItem[]
  ) {
    openQuote(c);
    setQuoteOrderId(orderId || null);
    if (items.length > 0) setQuoteLines(prefillQuoteLines(items));
  }

  useEffect(() => {
    if (!quotePrefill || !customers) return;
    if (!quotePrefill.customerId) return;
    const existing = customers.find((c) => c.id === quotePrefill.customerId);
    onQuotePrefillHandledRef.current?.();
    if (existing) {
      openQuoteWithItems(existing, quotePrefill.orderId, quotePrefill.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotePrefill, customers]);

  function addLine(type: "item" | "service") {
    setQuoteLines((prev) => [...prev, blankQuoteLine(type)]);
  }

  function updateLine(id: string, patch: Partial<QuoteLine>) {
    setQuoteLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  function removeLine(id: string) {
    setQuoteLines((prev) => prev.filter((l) => l.id !== id));
  }

  function addFromProducts(name: string) {
    if (!name || !catalog) return;
    const p = catalog.products.find((x) => x.name === name);
    if (p) {
      const line = blankQuoteLine("item");
      setQuoteLines((prev) => [
        ...prev,
        { ...line, description: p.name, price: p.price / 1.13 },
      ]);
    }
  }

  function addFromServices(title: string) {
    if (!title) return;
    const line = blankQuoteLine("service");
    setQuoteLines((prev) => [...prev, { ...line, description: title }]);
  }

  const subtotal = round2(
    quoteLines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0)
  );
  const vatRate = Number(quoteVatRate);
  const effectiveVatRate =
    Number.isFinite(vatRate) && vatRate > 0 ? Math.min(100, vatRate) : 0;
  const discountScheme = (catalog?.discounts ?? []).find(
    (d) => d.id === quoteDiscountId
  );
  const discountPercent = discountScheme
    ? Math.min(100, Math.max(0, Number(discountScheme.percent) || 0))
    : 0;
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const net = round2(subtotal - discountAmount);
  const vat = round2((net * effectiveVatRate) / 100);
  const grandTotal = round2(net + vat);

  async function sendQuote() {
    if (!quoteTarget) return;
    if (!quoteTarget.email.trim()) {
      setQuoteStatus("Failed: add an email address for this customer first.");
      return;
    }
    const validLines = quoteLines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      setQuoteStatus("Failed: add at least one item or service.");
      return;
    }
    setSending(true);
    setQuoteStatus("");
    try {
      const cleaned = customers?.filter((c) => c.name.trim() || c.email.trim());
      if (cleaned) await apiPut("customers", cleaned);
      const res = await fetch("/api/admin/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: quoteTarget.id,
          items: validLines.map((l) => ({
            type: l.type,
            description: l.description.trim(),
            qty: Number(l.qty) || 1,
            price: Number(l.price) || 0,
          })),
          vatRate: effectiveVatRate,
          notes: quoteNotes.trim(),
          specs: quoteSpecs.trim(),
          terms: quoteTerms.trim(),
          discountId: quoteDiscountId || undefined,
          orderId: quoteOrderId || undefined,
        }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setQuoteStatus("Quote sent to " + quoteTarget.email);
        await apiGet<Customer[]>("customers").then(setCustomers);
        setTimeout(() => setQuoteTarget(null), 1200);
      } else {
        setQuoteStatus(`Failed: ${body.error || "could not send"}`);
      }
    } catch (e) {
      setQuoteStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  function previewQuote() {
    if (!quoteTarget) return;
    const validLines: QuotationLine[] = quoteLines
      .filter((l) => l.description.trim())
      .map((l) => ({
        type: l.type,
        description: l.description.trim(),
        qty: Number(l.qty) || 1,
        price: Number(l.price) || 0,
      }));
    const billTo: QuotationParty = {
      name: quoteTarget.name,
      email: quoteTarget.email,
      company: quoteTarget.company,
      address: quoteTarget.address,
      phone: quoteTarget.phone,
    };
    const co = catalog?.company;
    const company = co?.name
      ? co
      : { name: "TechBucket", email: "", address: "", phones: [], vatNo: "" };
    const preparedBy: QuotationParty = {
      name: signatureName(user.signatory, user.name),
      email: user.email || company.email,
      title: user.designation,
      signature: user.signature
        ? `${window.location.origin}${user.signature}`
        : undefined,
      stamp: `${window.location.origin}/api/admin/stamp`,
    };
    const html = renderQuotationHtml({
      origin: window.location.origin,
      company,
      quote: {
        quoteNo: "DRAFT",
        date: quoteDate(),
        items: validLines,
        vatRate: effectiveVatRate,
        discountPercent,
        discountAmount,
        subtotal,
        vat,
        total: grandTotal,
        notes: quoteNotes.trim(),
        specs: quoteSpecs.trim(),
        terms: quoteTerms.trim(),
        validUntil: validUntil(),
      },
      preparedBy,
      billTo,
      letterhead: true,
    });
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      setQuoteStatus("Allow pop-ups to preview the quotation.");
    }
  }

  function openSuchidarta(c: Customer) {
    setSuchiTarget(c);
    setSuchiRecipient(
      ["श्री कार्यालय प्रमुख ज्यू,", c.name, c.company, c.address]
        .filter(Boolean)
        .join("\n")
    );
    setSuchiBody(defaultSuchidartaBody());
    setSuchiDate(bsDateNepali());
    setSuchiStatus("");
  }

  function previewSuchidarta() {
    if (!suchiTarget) return;
    const co = catalog?.company;
    const companyName = co?.name || "TechBucket";
    const html = renderSuchidartaHtml({
      origin: window.location.origin,
      data: {
        recipient: suchiRecipient.trim(),
        body: suchiBody.trim(),
        signatory: signatureName(user.signatory, user.name),
        designation: user.designation,
        signatureSrc: user.signature
          ? `${window.location.origin}${user.signature}`
          : undefined,
        stampSrc: `${window.location.origin}/api/admin/stamp`,
        companyName,
        tagline: [
          co?.address ?? "",
          [co?.email ?? "", ...(co?.phones ?? [])].filter(Boolean).join(" · "),
          co?.vatNo ? `PAN/VAT: ${co.vatNo}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        contactLine: letterContactLine(co?.phones ?? []),
        date: suchiDate.trim(),
      },
      letterhead: true,
    });
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      setSuchiStatus("Allow pop-ups to preview the letter.");
    }
  }

  async function sendSuchidarta() {
    if (!suchiTarget) return;
    if (!suchiTarget.email.trim()) {
      setSuchiStatus("Failed: add an email address for this customer first.");
      return;
    }
    if (!suchiRecipient.trim()) {
      setSuchiStatus("Failed: add the recipient address.");
      return;
    }
    if (!suchiBody.trim()) {
      setSuchiStatus("Failed: letter body cannot be empty.");
      return;
    }
    setSuchiSending(true);
    setSuchiStatus("");
    try {
      const cleaned = customers?.filter((c) => c.name.trim() || c.email.trim());
      if (cleaned) await apiPut("customers", cleaned);
      const res = await fetch("/api/admin/send-suchidarta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: suchiTarget.id,
          recipient: suchiRecipient.trim(),
          body: suchiBody.trim(),
          date: suchiDate.trim(),
        }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setSuchiStatus("Letter sent to " + suchiTarget.email);
        await apiGet<Customer[]>("customers").then(setCustomers);
        setTimeout(() => setSuchiTarget(null), 1200);
      } else {
        setSuchiStatus(`Failed: ${body.error || "could not send"}`);
      }
    } catch (e) {
      setSuchiStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setSuchiSending(false);
    }
  }

  function openOrder(c: Customer, q: Quote) {
    setOrderTarget({ customer: c, quote: q });
    setOrderType("delivery");
    setOrderNote("");
    setOrderStatus("");
  }

  async function submitOrder() {
    if (!orderTarget) return;
    setOrderSending(true);
    setOrderStatus("");
    try {
      const res = await fetch("/api/admin/fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: orderTarget.quote.id,
          orderType,
          notes: orderNote.trim(),
        }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setOrderStatus(`Order created: ${body.order.orderNo}`);
        setConverted((prev) => ({
          ...prev,
          [orderTarget.quote.id]: body.order.orderNo,
        }));
        setTimeout(() => setOrderTarget(null), 1400);
      } else {
        setOrderStatus(`Failed: ${body.error || "could not create order"}`);
      }
    } catch (e) {
      setOrderStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setOrderSending(false);
    }
  }

  if (!customers) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  const sorted = [...customers].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          Customers ({customers.length})
        </h3>
        <div className="flex items-center gap-2">
          {status && <span className="text-sm text-slate-500">{status}</span>}
          <GhostButton type="button" onClick={addNew}>
            + Add customer
          </GhostButton>
          <PrimaryButton type="button" onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>

      {sorted.length === 0 && !showNew ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No customers yet. Add your first customer to start sending quotes.
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((c) => {
            const editing = editingId === c.id;
            const quotes = c.quotes ?? [];
            return (
              <li
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white"
              >
                {editing ? (
                  <div className="p-4">
                    <p className="mb-4 text-sm font-semibold text-brand-700">
                      {showNew ? "New customer" : "Edit customer"}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Name *"
                        value={c.name}
                        onChange={(e) => update(c.id, { name: e.target.value })}
                      />
                      <Input
                        label="Email *"
                        type="email"
                        value={c.email}
                        onChange={(e) => update(c.id, { email: e.target.value })}
                      />
                      <Input
                        label="Phone"
                        value={c.phone}
                        onChange={(e) => update(c.id, { phone: e.target.value })}
                      />
                      <Input
                        label="Company"
                        value={c.company}
                        onChange={(e) =>
                          update(c.id, { company: e.target.value })
                        }
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Address"
                          value={c.address}
                          onChange={(e) =>
                            update(c.id, { address: e.target.value })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Textarea
                          label="Notes"
                          rows={3}
                          value={c.notes}
                          onChange={(e) => update(c.id, { notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setShowNew(false);
                          void save();
                        }}
                      >
                        Done
                      </PrimaryButton>
                      <DangerButton
                        type="button"
                        onClick={() => remove(c.id)}
                      >
                        Delete
                      </DangerButton>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setDetailId(c.id)}
                          className="text-left text-sm font-semibold text-slate-900 transition-colors hover:text-brand-700"
                          title="View full customer activity"
                        >
                          {c.name || "Untitled customer"}
                        </button>
                        <p className="text-xs text-slate-500">
                          {c.email}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </p>
                        {(c.company || c.address) && (
                          <p className="mt-1 text-xs text-slate-400">
                            {[c.company, c.address].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          Added by {c.createdBy || "—"} · {formatDate(c.createdAt)}
                        </p>
                        {c.notes && (
                          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                            {c.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <GhostButton
                          type="button"
                          onClick={() => setDetailId(c.id)}
                        >
                          View / Track
                        </GhostButton>
                        <GhostButton
                          type="button"
                          onClick={() => {
                            setShowNew(false);
                            setEditingId(c.id);
                          }}
                        >
                          Edit
                        </GhostButton>
                        <GhostButton
                          type="button"
                          onClick={() => openSuchidarta(c)}
                        >
                          Suchidarta
                        </GhostButton>
                        <PrimaryButton type="button" onClick={() => openQuote(c)}>
                          Send quote
                        </PrimaryButton>
                      </div>
                    </div>

                    {quotes.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <Label>Quote history</Label>
                        <ul className="space-y-1.5">
                          {quotes.map((q) => (
                            <li
                              key={q.id}
                              className="flex flex-wrap items-center gap-2 text-xs"
                            >
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${
                                  q.status === "sent"
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                    : "bg-red-50 text-red-700 ring-red-600/20"
                                }`}
                              >
                                {q.status}
                              </span>
                              <span className="text-slate-700">
                                {q.quoteNo ? `${q.quoteNo} · ` : ""}
                                {q.subject}
                                {q.total !== undefined ? ` — ${money(q.total)}` : ""}
                              </span>
                              <span className="text-slate-400">
                                to {q.to} · by {q.sentBy} · {formatDate(q.sentAt)}
                              </span>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                onClick={() =>
                                  window.open(
                                    `/api/admin/quotation?id=${q.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                Print
                              </button>
                              {q.status === "sent" &&
                                (converted[q.id] ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
                                    Order placed · {converted[q.id]}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-0.5 font-medium text-brand-700 transition-colors hover:bg-brand-100"
                                    onClick={() => openOrder(c, q)}
                                  >
                                    Proceed to order
                                  </button>
                                ))}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {c.suchidarta && c.suchidarta.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <Label>Suchidarta history</Label>
                        <ul className="space-y-1.5">
                          {c.suchidarta.map((r) => (
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
                                सुची दर्ता निवेदन — {r.recipient.split("\n")[0]}
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
                                    `/api/admin/suchidarta?id=${r.id}`,
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
              </li>
            );
          })}
        </ul>
      )}

      {quoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Quotation for {quoteTarget.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Sent from your email ({user.email || "not configured"}) to{" "}
              {quoteTarget.email} · Subject: Quotation QT-… for{" "}
              {quoteTarget.name}
            </p>

            <div className="mt-4 space-y-2">
              {quoteLines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 p-2"
                >
                  <span
                    className={`col-span-2 rounded-full px-2 py-1 text-center text-xs font-semibold ${
                      line.type === "item"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {line.type === "item" ? "Product" : "Service"}
                  </span>
                  <input
                    className="col-span-4 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) =>
                      updateLine(line.id, { description: e.target.value })
                    }
                  />
                  <input
                    className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-brand-500 focus:outline-none"
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={line.qty || ""}
                    onChange={(e) =>
                      updateLine(line.id, { qty: Number(e.target.value) })
                    }
                  />
                  <input
                    className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right focus:border-brand-500 focus:outline-none"
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={line.price || ""}
                    onChange={(e) =>
                      updateLine(line.id, { price: Number(e.target.value) })
                    }
                  />
                  <span className="col-span-1 text-right text-sm text-slate-700">
                    {money((Number(line.qty) || 0) * (Number(line.price) || 0))}
                  </span>
                  <button
                    type="button"
                    className="col-span-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                    onClick={() => removeLine(line.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {catalog && (
                  <>
                    <SearchablePicker
                      placeholder="Search products…"
                      items={catalog.products.map((p) => p.name)}
                      onPick={addFromProducts}
                      disabled={sending}
                    />
                    <SearchablePicker
                      placeholder="Search services…"
                      items={catalog.services.map((s) => s.title)}
                      onPick={addFromServices}
                      disabled={sending}
                    />
                  </>
                )}
                <GhostButton type="button" onClick={() => addLine("item")}>
                  + Add item
                </GhostButton>
                <GhostButton type="button" onClick={() => addLine("service")}>
                  + Add service
                </GhostButton>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-40">
                  <Label>VAT rate (%)</Label>
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    type="number"
                    min="0"
                    max="100"
                    value={quoteVatRate}
                    onChange={(e) => setQuoteVatRate(e.target.value)}
                  />
                </div>
                {catalog?.discounts?.length ? (
                  <div>
                    <Label>Discount scheme</Label>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
                      value={quoteDiscountId}
                      onChange={(e) => setQuoteDiscountId(e.target.value)}
                    >
                      <option value="">No discount</option>
                      {catalog.discounts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.percent}%)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
              <div className="space-y-1 text-right text-sm">
                <p className="text-slate-600">
                  Subtotal: <span className="font-medium">{money(subtotal)}</span>
                </p>
                {discountAmount > 0 && (
                  <>
                    <p className="text-slate-600">
                      Discount ({discountPercent}%):{" "}
                      <span className="font-medium text-emerald-600">
                        −{money(discountAmount)}
                      </span>
                    </p>
                    <p className="text-slate-600">
                      After discount:{" "}
                      <span className="font-medium">{money(net)}</span>
                    </p>
                  </>
                )}
                <p className="text-slate-600">
                  VAT ({effectiveVatRate}%):{" "}
                  <span className="font-medium">{money(vat)}</span>
                </p>
                <p className="text-base font-bold text-slate-900">
                  Grand Total: {money(grandTotal)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                label="Notes (optional)"
                rows={3}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Terms, delivery info, validity, etc."
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Product description / technical specifications (optional)"
                rows={5}
                value={quoteSpecs}
                onChange={(e) => setQuoteSpecs(e.target.value)}
                placeholder={"1. Kiosk Cabinet\n> Durable cold-roll steel frame\n2. Industrial PC System\n> Intel Core i5, 8GB RAM + 256GB SSD"}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Terms & conditions (optional)"
                rows={4}
                value={quoteTerms}
                onChange={(e) => setQuoteTerms(e.target.value)}
                placeholder={"1. Payment terms\n2. Delivery schedule\n3. Warranty"}
              />
            </div>

            {quoteStatus && (
              <p className="mt-3 text-sm text-slate-600">{quoteStatus}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton
                type="button"
                onClick={() => setQuoteTarget(null)}
                disabled={sending}
              >
                Cancel
              </GhostButton>
              <GhostButton type="button" onClick={previewQuote} disabled={sending}>
                Preview / Print
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={sendQuote}
                disabled={sending}
              >
                {sending ? "Sending…" : "Send quote"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {suchiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Suchidarta letter for {suchiTarget.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              सुची दर्ता निवेदन — formal Nepali letter in the Suchi Registrar
              format. Date, subject, company name and contact are filled
              automatically. The signature name comes from your profile.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <Input
                  label="Date (मिति)"
                  value={suchiDate}
                  onChange={(e) => setSuchiDate(e.target.value)}
                  placeholder="Auto-filled with today's B.S. date"
                />
              </div>

              <div>
                <Textarea
                  label="Recipient (श्री, …)"
                  rows={4}
                  value={suchiRecipient}
                  onChange={(e) => setSuchiRecipient(e.target.value)}
                  placeholder={"नेपाल सरकार\n… विभाग\nकाठमाडौँ, नेपाल ।"}
                />
              </div>

              <div>
                <Textarea
                  label="Letter body (निवेदन)"
                  rows={8}
                  value={suchiBody}
                  onChange={(e) => setSuchiBody(e.target.value)}
                />
              </div>
            </div>

            {suchiStatus && (
              <p className="mt-3 text-sm text-slate-600">{suchiStatus}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton
                type="button"
                onClick={() => setSuchiTarget(null)}
                disabled={suchiSending}
              >
                Cancel
              </GhostButton>
              <GhostButton
                type="button"
                onClick={previewSuchidarta}
                disabled={suchiSending}
              >
                Preview / Print
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={sendSuchidarta}
                disabled={suchiSending}
              >
                {suchiSending ? "Sending…" : "Send as email"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {orderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Proceed to order
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Convert quote {orderTarget.quote.quoteNo} into a fulfillment order
              for {orderTarget.customer.name}. The items and totals are copied
              from the quote, and the logistics team will see it in the
              Fulfillment tab.
            </p>

            <div className="mt-4">
              <Label>Order type</Label>
              <div className="space-y-2">
                {(["delivery", "pickup"] as OrderType[]).map((t) => (
                  <label
                    key={t}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                      orderType === t
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === t}
                      onChange={() => setOrderType(t)}
                      className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">
                        {ORDER_TYPE_LABELS[t]}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {t === "delivery"
                          ? "Logistics prepares the devices and delivers them to the customer."
                          : "Logistics prepares the devices, sales is notified, then the customer collects / sales hands over."}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                label="Note for logistics (optional)"
                rows={3}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Delivery instructions, installation note, etc."
              />
            </div>

            {orderStatus && (
              <p className="mt-3 text-sm text-slate-600">{orderStatus}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton
                type="button"
                onClick={() => setOrderTarget(null)}
                disabled={orderSending}
              >
                Cancel
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={submitOrder}
                disabled={orderSending}
              >
                {orderSending ? "Creating…" : "Create order"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {detailId && (
        <CustomerDetail
          key={detailId}
          customerId={detailId}
          onClose={() => setDetailId(null)}
          onJumpTo={onJumpTo ?? (() => {})}
        />
      )}
    </div>
  );
}
