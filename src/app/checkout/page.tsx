"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useCart } from "@/components/shop/CartContext";
import { Icon } from "@/components/icons";
import { contactEmail, formatNPR, whatsappOrderLink } from "@/lib/format";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const orderLines = items
    .map((it) => `- ${it.name} x${it.qty} (${formatNPR(it.price * it.qty)})`)
    .join("\n");

  const body = encodeURIComponent(
    `Hello TechBucket,\n\nNew product order request:\n\n${orderLines}\n\nSubtotal: ${formatNPR(
      subtotal
    )}\n\nName: ${name || "—"}\nPhone: ${phone || "—"}\n\n${note ? `Notes:\n${note}\n\n` : ""}Please confirm availability and delivery details.`
  );

  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    "Product order request"
  )}&body=${body}`;

  const waHref = whatsappOrderLink(
    items.map((it) => ({ name: it.name, qty: it.qty }))
  );

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
            <div className="rounded-3xl border border-dashed border-slate-200 p-16 text-center">
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
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Suman Shrestha"
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
                <a
                  href={mailtoHref}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  <Icon name="mail" className="h-5 w-5" />
                  Send order by email
                </a>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
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

            <aside className="h-fit rounded-2xl border border-slate-100 bg-slate-50 p-5">
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
