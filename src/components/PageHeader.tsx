import Link from "next/link";

export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  breadcrumb: string;
}) {
  return (
    <section className="bg-gradient-to-b from-brand-50 via-surface to-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition-colors hover:text-brand-700">
            Home
          </Link>
          <span aria-hidden>›</span>
          <span className="font-medium text-slate-800">{breadcrumb}</span>
        </nav>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
