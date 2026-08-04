import Link from "next/link";
import { Icon } from "./icons";

export default function CTABanner({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <section className="bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-brand-100">
            {description}
          </p>
        </div>
        <Link
          href="/#contact"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
        >
          {cta}
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
