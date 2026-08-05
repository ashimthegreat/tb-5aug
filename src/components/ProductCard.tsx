import type { Product } from "@/lib/data";
import { Icon } from "./icons";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon name={product.icon} className="h-7 w-7" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-ink">{product.name}</h3>
      <p className="mt-1 text-sm font-medium text-brand-700">{product.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {product.description}
      </p>
      {product.features.length > 0 && (
        <ul className="mt-5 space-y-2">
          {product.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
