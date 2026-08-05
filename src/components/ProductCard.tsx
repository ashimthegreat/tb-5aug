import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/data";
import { effectivePrice, formatNPR, stockBadge, stockLabels } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const price = effectivePrice(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-brand-50/40 p-6">
        <Image
          src={product.images[0] ?? "/images/products/placeholder.svg"}
          alt={product.name}
          width={400}
          height={300}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${stockBadge[product.stock]}`}
        >
          {stockLabels[product.stock]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-ink group-hover:text-brand-700">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
          {product.summary}
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            {product.salePrice ? (
              <>
                <p className="text-xs text-slate-400 line-through">
                  {formatNPR(product.price)}
                </p>
                <p className="text-lg font-bold text-brand-700">
                  {formatNPR(product.salePrice)}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-ink">{formatNPR(price)}</p>
            )}
            <p className="text-xs text-slate-400">NPR incl. VAT</p>
          </div>
          <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}
