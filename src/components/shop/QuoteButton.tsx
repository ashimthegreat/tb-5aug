"use client";

import { useState } from "react";
import type { Product } from "@/lib/data";
import { Icon } from "../icons";
import { mailtoForProduct } from "@/lib/format";

export default function QuoteButton({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-1 flex-col gap-3">
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
      </div>
      <a
        href={mailtoForProduct(product, qty)}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
      >
        <Icon name="send" className="h-5 w-5" />
        Request a quote
      </a>
    </div>
  );
}
