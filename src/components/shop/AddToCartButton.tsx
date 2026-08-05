"use client";

import { useState } from "react";
import type { Product } from "@/lib/data";
import { useCart } from "./CartContext";
import { Icon } from "../icons";
import { effectivePrice } from "@/lib/format";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const disabled = product.stock === "out-of-stock";

  function handleAdd() {
    if (disabled) return;
    addItem(
      {
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? "",
        price: effectivePrice(product),
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-3">
        <div className="flex h-12 items-center rounded-xl border border-slate-200">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-full w-10 items-center justify-center text-slate-600 transition-colors hover:text-brand-700"
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
            className="flex h-full w-10 items-center justify-center text-slate-600 transition-colors hover:text-brand-700"
          >
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={handleAdd}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Icon name="cart" className="h-5 w-5" />
          {added ? "Added to cart" : "Add to cart"}
        </button>
      </div>
      {disabled && (
        <p className="text-sm text-slate-500">
          This product is currently out of stock.
        </p>
      )}
    </div>
  );
}
