import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getServices } from "@/lib/data";
import ServiceCard from "@/components/ServiceCard";
import CTABanner from "@/components/CTABanner";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Full-stack IT services from TechBucket — custom software, networking, cybersecurity, cloud, data, consulting, managed IT and more for every industry, with healthcare as our flagship vertical.",
};

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([
    getCategories(),
    getServices(),
  ]);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const serviceCount = (categoryId: string) =>
    services.filter((s) => s.categoryId === categoryId).length;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-surface to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,96,32,0.14),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(240,96,32,0.10),transparent_45%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle,rgba(15,23,42,0.14)_1px,transparent_1px)] [background-size:28px_28px]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-20">
          <div className="reveal">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="transition-colors hover:text-brand-700">
                Home
              </Link>
              <span aria-hidden>›</span>
              <span className="font-medium text-slate-800">Services</span>
            </nav>
            <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Services
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Everything We Do
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Custom software, networking, cybersecurity, cloud, data,
              consulting and managed IT for every industry — with healthcare
              as our flagship vertical — delivered end-to-end by one team.
            </p>
          </div>

          <div className="reveal">
            <div className="rounded-3xl border border-slate-100 bg-white/70 p-7 shadow-xl shadow-slate-900/5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Jump to a discipline
                </h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {sortedCategories.length} areas
                </span>
              </div>
              <ul className="mt-5 grid gap-1.5 sm:grid-cols-2">
                {sortedCategories.map((category) => (
                  <li key={category.id}>
                    <a
                      href={`#${category.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-brand-100 hover:bg-white"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Icon name={category.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {category.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {serviceCount(category.id)} services
                        </span>
                      </span>
                      <Icon
                        name="arrow"
                        className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
                      />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                >
                  Looking for products? Visit the shop
                  <Icon
                    name="arrow"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Service categories"
        className="sticky top-16 z-40 border-y border-slate-100 bg-white/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {sortedCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon name={category.icon} className="h-4 w-4 text-brand-600" />
              {category.name}
            </a>
          ))}
        </div>
      </nav>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-20 px-4 sm:px-6 lg:px-8">
          {sortedCategories.map((category, i) => {
            const items = services
              .filter((s) => s.categoryId === category.id)
              .sort((a, b) => a.order - b.order);
            if (items.length === 0) return null;
            return (
              <div key={category.id} id={category.id} className="scroll-mt-36">
                <div className="relative flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-2 -top-10 select-none text-7xl font-bold leading-none text-slate-100 sm:text-8xl"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Icon name={category.icon} className="h-6 w-6" />
                  </span>
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                        {category.name}
                      </h2>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                        {items.length} service{items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-slate-600">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((service) => (
                    <ServiceCard
                      key={service.id}
                      icon={service.icon}
                      title={service.title}
                      description={service.description}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <p className="text-center text-slate-500">
              No services yet. Check back soon.
            </p>
          )}
        </div>
      </section>
      <CTABanner
        title="Need a solution not listed here?"
        description="We build custom software for every industry — with healthcare as our flagship vertical — and supply genuine IT infrastructure products. Tell us what you want to achieve."
        cta="Get in Touch"
      />
    </>
  );
}
