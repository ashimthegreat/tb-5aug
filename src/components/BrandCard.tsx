import Image from "next/image";
import type { Brand } from "@/lib/data";
import { Icon } from "./icons";

export default function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md">
      <div className="flex h-24 items-center justify-center rounded-xl bg-surface px-4">
        <Image
          src={brand.logo}
          alt={`${brand.name} logo`}
          width={200}
          height={80}
          className="max-h-20 w-auto object-contain"
        />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{brand.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {brand.blurb}
      </p>
      {brand.url && (
        <a
          href={brand.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          Visit website
          <Icon name="external" className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
