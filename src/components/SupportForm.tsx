"use client";

import { useState } from "react";
import { Icon } from "./icons";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

const categories = ["Technical", "Billing", "Product Enquiry", "Other"];
const priorities = ["Low", "Medium", "High", "Urgent"];

export default function SupportForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<{
    ticketNo: string;
    emailSent: boolean;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          category: data.get("category"),
          priority: data.get("priority"),
          product: data.get("product"),
          subject: data.get("subject"),
          message: data.get("message"),
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        ticketNo?: string;
        emailSent?: boolean;
        error?: string;
      };
      if (!res.ok || !body.ok || !body.ticketNo) {
        setError(body.error || "Something went wrong. Please try again.");
        return;
      }
      setTicket({ ticketNo: body.ticketNo, emailSent: Boolean(body.emailSent) });
      form.reset();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (ticket) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-ink">Ticket Raised!</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your support ticket{" "}
          <span className="font-bold text-brand-700">{ticket.ticketNo}</span>{" "}
          has been submitted. Our team will get back to you at the email you
          provided.
        </p>
        {!ticket.emailSent && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Note: our email notification could not be sent right now, but your
            ticket is saved. Please call us if it&apos;s urgent.
          </p>
        )}
        <button
          type="button"
          onClick={() => setTicket(null)}
          className="mt-6 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h3 className="text-xl font-bold text-ink">Raise a Support Ticket</h3>
      <p className="mt-1 text-sm text-slate-500">
        Fill in the details and we&apos;ll respond as soon as possible. Fields
        marked * are required.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Full Name *
          </label>
          <input id="name" name="name" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email Address *
          </label>
          <input id="email" name="email" type="email" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
            Phone / WhatsApp
          </label>
          <input id="phone" name="phone" type="tel" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-ink">
            Category *
          </label>
          <select id="category" name="category" required defaultValue="Technical" className={inputClasses}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-ink">
            Priority
          </label>
          <select id="priority" name="priority" defaultValue="Medium" className={inputClasses}>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product" className="mb-1.5 block text-sm font-medium text-ink">
            Related product / order (optional)
          </label>
          <input id="product" name="product" className={inputClasses} />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">
          Subject *
        </label>
        <input id="subject" name="subject" required className={inputClasses} />
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
          Describe your issue *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className={`${inputClasses} resize-y`}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Submitting…" : "Raise Ticket"}
        <Icon name="send" className="h-4 w-4" />
      </button>
    </form>
  );
}
