"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";
import { Icon } from "../icons";
import { formatNPR } from "@/lib/format";

export default function CartView() {
  const { items, subtotal, updateQty, removeItem, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon name="cart" className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-ink">Your cart is empty</h2>
        <p className="mt-2 text-slate-500">
          Browse the catalog and add products to start an order.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Icon name="arrow" className="h-4 w-4 rotate-180" />
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        {items.map((item) => (
          <div
            key={item.slug}
            className="grid grid-cols-[4.5rem_1fr] items-center gap-x-4 gap-y-3 border-b border-slate-100 bg-white p-4 last:border-0 sm:flex sm:items-center sm:gap-4"
          >
            <Link
              href={`/products/${item.slug}`}
              className="flex h-18 w-18 items-center justify-center rounded-xl bg-brand-50/40 p-2"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Icon name="server" className="h-8 w-8 text-brand-700" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="block truncate font-semibold text-ink hover:text-brand-700"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatNPR(item.price)} each
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 items-center rounded-lg border border-slate-200">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQty(item.slug, item.qty - 1)}
                    className="flex h-full w-8 items-center justify-center text-slate-600 hover:text-brand-700"
                  >
                    <Icon name="minus" className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-ink">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => updateQty(item.slug, item.qty + 1)}
                    className="flex h-full w-8 items-center justify-center text-slate-600 hover:text-brand-700"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.slug)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600"
                >
                  <Icon name="trash" className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
            <p className="col-span-2 shrink-0 text-right text-base font-bold text-ink sm:col-span-1">
              {formatNPR(item.price * item.qty)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Subtotal ({items.reduce((n, it) => n + it.qty, 0)} items)
          </p>
          <p className="mt-1 text-3xl font-bold text-ink">{formatNPR(subtotal)}</p>
          <p className="mt-1 text-xs text-slate-400">
            NPR, inclusive of VAT. Delivery &amp; installation quoted after your
            order.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/checkout"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Proceed to order
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-sm text-slate-500 hover:text-red-600"
          >
            Clear cart
          </button>
        </div>
      </div>
    </div>
  );
}
