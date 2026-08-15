"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useCart } from "@/components/shop/CartContext";
import { Icon } from "@/components/icons";
import { contactEmail, formatNPR, whatsappOrderLink } from "@/lib/format";
import { isValidEmail, isValidPhone } from "@/lib/validation";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const orderLines = items
    .map((it) => `- ${it.name} x${it.qty} (${formatNPR(it.price * it.qty)})`)
    .join("\n");

  const body = encodeURIComponent(
    `Hello TechBucket,\n\nNew product order request:\n\n${orderLines}\n\nSubtotal: ${formatNPR(
      subtotal
    )}\n\nName: ${name || "—"}\nEmail: ${email || "—"}\nPhone: ${phone || "—"}\n\n${note ? `Notes:\n${note}\n\n` : ""}Please confirm availability and delivery details.`
  );

  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    "Product order request"
  )}&body=${body}`;

  const waHref = whatsappOrderLink(
    items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })),
    subtotal
  );

  function logOrder(channel: "email" | "whatsapp") {
    void fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        note: note.trim(),
        subtotal,
        items: items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
      }),
    }).catch(() => {});
  }

  function validateForm(): boolean {
    if (!name.trim() || !email.trim()) {
      setFormError("Please enter your full name and email address.");
      return false;
    }
    if (!isValidEmail(email)) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setFormError("Please enter a valid phone number.");
      return false;
    }
    setFormError("");
    return true;
  }

  function handleOrderClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    channel: "email" | "whatsapp"
  ) {
    if (!validateForm()) {
      e.preventDefault();
      return;
    }
    logOrder(channel);
  }

  async function submitOrder() {
    if (!validateForm()) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "web",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          note: note.trim(),
          subtotal,
          items: items.map((it) => ({
            name: it.name,
            qty: it.qty,
            price: it.price,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setFormError(body.error || "Could not submit your order. Please try again.");
        return;
      }
      setSubmitted(true);
      clear();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Order Received"
          description="Thank you — your order request has been sent to our team."
          breadcrumb="Checkout"
        />
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center sm:p-16">
              <p className="text-lg font-semibold text-emerald-800">
                Your order request was submitted successfully.
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                We received your order and will confirm availability, delivery
                and installation with you shortly.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Checkout"
          title="Place Your Order"
          description="Order-by-enquiry: we confirm availability, delivery and installation with you directly."
          breadcrumb="Checkout"
        />
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center sm:p-16">
              <p className="text-lg font-semibold text-ink">Your cart is empty</p>
              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Browse products
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Place Your Order"
        description="Order-by-enquiry: we confirm availability, delivery and installation with you directly."
        breadcrumb="Checkout"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <h2 className="text-xl font-bold text-ink">Your details</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Full name *</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Suman Shrestha"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Email address *
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Phone / WhatsApp
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98XXXXXXXX"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Notes (optional)
                  </span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Delivery address, installation requirements, preferred timeline…"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
              </div>

              <div className="mt-8 space-y-3">
                {formError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {formError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void submitOrder()}
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  <Icon name="check" className="h-5 w-5" />
                  {submitting ? "Submitting…" : "Submit order request"}
                </button>
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400">
                    or send via
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <a
                  href={mailtoHref}
                  onClick={(e) => handleOrderClick(e, "email")}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  <Icon name="mail" className="h-5 w-5" />
                  Send order by email
                </a>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleOrderClick(e, "whatsapp")}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Icon name="phone" className="h-5 w-5" />
                  Order via WhatsApp
                </a>
                <button
                  type="button"
                  onClick={clear}
                  className="text-sm text-slate-500 hover:text-red-600"
                >
                  Clear cart
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-ink">Order summary</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.slug} className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Icon name="server" className="h-5 w-5 text-brand-700" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Qty {item.qty}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {formatNPR(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="text-lg font-bold text-ink">
                    {formatNPR(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Prices are indicative in NPR. We confirm exact pricing,
                  delivery and installation when we respond to your order.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
