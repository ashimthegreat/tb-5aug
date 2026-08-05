"use client";

import { iconNames } from "./icons-list";
import { Icon } from "@/components/icons";

export default function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Icon
      </p>
      <div className="flex flex-wrap gap-2">
        {iconNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            title={name}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              value === name
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            <Icon name={name} className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
