import Image from "next/image";
import type { Partner } from "@/lib/data";
import { Icon } from "./icons";

function initials(name: string) {
  return name
    .split(/[\s—–-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md">
      {partner.logo ? (
        <div className="flex h-20 w-full items-center justify-center">
          <Image
            src={partner.logo}
            alt={`${partner.name} logo`}
            width={160}
            height={70}
            className="max-h-20 w-auto object-contain"
          />
        </div>
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
          {initials(partner.name)}
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-ink">{partner.name}</h3>
      {partner.url && (
        <a
          href={partner.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          Visit website
          <Icon name="external" className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
