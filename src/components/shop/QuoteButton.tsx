"use client";

import { useState } from "react";
import type { Product } from "@/lib/data";
import { Icon } from "../icons";
import { effectivePrice, formatNPR } from "@/lib/format";
import { isValidEmail, isValidPhone } from "@/lib/validation";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function QuoteButton({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const price = effectivePrice(product);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          qty,
          price,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          note: note.trim(),
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        setError(body.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 font-semibold text-emerald-700">
          <Icon name="check" className="h-5 w-5" />
          Quote request sent!
        </div>
        <p className="text-sm leading-relaxed text-emerald-800">
          Thank you, {name.trim() || "there"}. We&apos;ve received your request
          for {product.name} (x{qty}) and sent a confirmation to{" "}
          <span className="font-medium">{email.trim()}</span>. Our team will get
          back to you shortly with pricing and availability.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="text-left text-sm text-emerald-700 underline"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Quantity</span>
        <div className="flex h-10 items-center rounded-xl border border-slate-200">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-full w-9 items-center justify-center text-slate-600 hover:text-brand-700"
          >
            <Icon name="minus" className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-ink">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-full w-9 items-center justify-center text-slate-600 hover:text-brand-700"
          >
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-slate-500">
          {formatNPR(price * qty)} incl. VAT
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name *"
          className={inputClasses}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address *"
          className={inputClasses}
        />
      </div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone / WhatsApp"
        className={inputClasses}
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notes (optional) — delivery, timeline, specifications…"
        rows={2}
        className={`${inputClasses} resize-y`}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60"
      >
        <Icon name="send" className="h-5 w-5" />
        {submitting ? "Sending…" : "Request a quote"}
      </button>
    </form>
  );
}
