import {
  getSite,
  getCategories,
  getServices,
  getIndustries,
  getProducts,
  getBrands,
  getHome,
} from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";
import ThreeHero from "@/components/ThreeHero";
import { Icon } from "@/components/icons";
import { formatNPR } from "@/lib/format";
import type { Brand } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "TechBucket | Full-Stack IT Services & Software in Nepal",
  description:
    "TechBucket is a Nepal-based full-stack IT company delivering custom software, cybersecurity, networking, cloud, data, managed IT and genuine infrastructure products — with healthcare as our flagship vertical — across Nepal since 2019.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TechBucket | Full-Stack IT Services & Software in Nepal",
    description:
      "Full-stack IT services for every industry — with healthcare at the core — plus genuine infrastructure products in Nepal since 2019.",
  },
};

export default async function HomePage() {
  const [site, categories, services, industries, products, brands, home] =
    await Promise.all([
      getSite(),
      getCategories(),
      getServices(),
      getIndustries(),
      getProducts(),
      getBrands(),
      getHome(),
    ]);

  return (
    <>
      <Hero hero={site.hero} />
      <LogoMarquee brands={brands} />
      <About site={site} />
      <Stats stats={site.stats} subline={home.statsSubline} />
      <Services categories={categories} services={services} />
      <Industries industries={industries} services={services} />
      <Products products={products} />
      <Cases cases={home.cases} />
      <Process process={home.process} site={site} />
      <Testimonials testimonials={home.testimonials} />
      <Faq faq={home.faq} />
      <Insights insights={home.insights} />
      <CTASection site={site} />
      <Contact site={site} />
    </>
  );
}

function Hero({
  hero,
}: {
  hero: { eyebrow: string; title: string; subtitle: string };
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-surface to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,96,32,0.14),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(240,96,32,0.10),transparent_45%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle,rgba(15,23,42,0.14)_1px,transparent_1px)] [background-size:28px_28px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-28">
        <div className="reveal">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-brand-700 shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            {hero.eyebrow}
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {hero.title.split(/(Healthcare|Technology|Software)/i).map(
              (part, i) =>
                /^(Healthcare|Technology|Software)$/i.test(part) ? (
                  <span
                    key={i}
                    className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent"
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
            )}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30 sm:w-auto"
            >
              Get Started
              <Icon name="arrow" className="h-4 w-4" />
            </a>
            <a
              href="/services"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur transition-colors hover:border-brand-300 hover:text-brand-700 sm:w-auto"
            >
              Explore Services
            </a>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {siteStatsTrio.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-bold text-ink">{s.value}</dd>
                <dd className="text-sm text-slate-500">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ThreeHero />
      </div>

      <div className="relative flex justify-center pb-8">
        <a
          href="#about"
          className="inline-flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-widest text-slate-400 transition-colors hover:text-brand-600"
        >
          Scroll
          <svg
            className="h-4 w-4 animate-bounce"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}

const siteStatsTrio = [
  { value: "5+", label: "Years Experience" },
  { value: "50+", label: "Projects Delivered" },
  { value: "99%", label: "Client Satisfaction" },
];

function LogoMarquee({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;
  const doubled = [...brands, ...brands];
  return (
    <section aria-label="Technology partners" className="border-y border-slate-100 bg-white py-10">
      <p className="px-6 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
        Trusted technology partners
      </p>
      <div className="relative mx-auto mt-8 max-w-6xl overflow-hidden px-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent"
        />
        <div className="animate-marquee flex w-max items-center gap-12">
          {doubled.map((brand, i) => (
            <div
              key={`${brand.id}-${i}`}
              aria-hidden={i >= brands.length}
              className="flex items-center gap-2 whitespace-nowrap opacity-60 transition-opacity hover:opacity-100"
            >
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  width={120}
                  height={48}
                  className="max-h-10 w-auto object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-slate-500">{brand.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  const [first, ...rest] = site.about.paragraphs;
  return (
    <section id="about" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="reveal">
          <SectionHeading align="left" eyebrow="About Us" title={site.about.title} />
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{first}</p>
          {rest.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="mt-5 text-lg leading-relaxed text-slate-600"
            >
              {paragraph}
            </p>
          ))}
          <div className="mt-7 flex flex-wrap gap-3">
            {["Custom Software", "Cybersecurity", "Cloud & Data", "Managed IT"].map(
              (label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
                >
                  <Icon name="check" className="h-3.5 w-3.5" />
                  {label}
                </span>
              )
            )}
          </div>
          <a
            href="#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
          >
            Work with us
            <Icon name="arrow" className="h-4 w-4" />
          </a>
        </div>

        <div className="reveal grid gap-5 sm:grid-cols-2" style={{ animationDelay: "0.1s" }}>
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-slate-900 p-7 text-white shadow-xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-brand-700/40">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,179,138,0.5),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Icon name="spark" className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{site.mission.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-100">
                {site.mission.body}
              </p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-brand-50 to-white p-7 shadow-sm transition-shadow duration-300 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-200/50">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(240,96,32,0.18),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
                <Icon name="globe" className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{site.vision.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {site.vision.body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats({
  stats,
  subline,
}: {
  stats: { value: string; label: string }[];
  subline: string;
}) {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(240,96,32,0.25),transparent_50%),radial-gradient(circle_at_85%_0%,rgba(240,96,32,0.18),transparent_45%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="animate-gradient bg-gradient-to-r from-brand-400 via-brand-300 to-brand-400 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl">
                {stat.value}
              </p>
              <p className="mt-3 text-sm font-medium uppercase tracking-wide text-slate-400 sm:tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        {subline && (
          <p className="mt-12 border-t border-slate-800 pt-8 text-center text-lg text-slate-400">
            {subline}
          </p>
        )}
      </div>
    </section>
  );
}

function Services({
  categories,
  services,
}: {
  categories: { id: string; name: string; icon: string; description: string; order: number }[];
  services: { id: string; categoryId: string; icon: string; title: string; description: string; order: number }[];
}) {
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return (
    <section id="services" className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="End-to-End Services, One Partner"
          description="From custom software and cybersecurity to networking, cloud and managed IT — explore our complete range of services, organised by discipline."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((category, i) => {
            const items = services
              .filter((s) => s.categoryId === category.id)
              .sort((a, b) => a.order - b.order)
              .slice(0, 4);
            if (items.length === 0) return null;
            return (
              <div
                key={category.id}
                className="reveal rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div className="flex items-center gap-3 text-ink">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Icon name={category.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    <p className="text-sm text-slate-500">{category.description}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {items.map((service) => (
                    <li
                      key={service.id}
                      className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <Icon name={service.icon} className="h-4 w-4 shrink-0 text-brand-600" />
                      <span className="flex-1">{service.title}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/services#${category.id}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Explore
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
          >
            View all services
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <Link
            href="/industries"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            View all industries
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Industries({
  industries,
  services,
}: {
  industries: { id: string; name: string; icon: string; description: string; services: string[]; productsOnly?: boolean }[];
  services: { id: string; icon: string; title: string; description: string }[];
}) {
  const serviceById = new Map(services.map((s) => [s.id, s]));
  return (
    <section id="industries" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Industries"
          title="Built for Your Industry"
          description="Full-stack IT services for every industry — with healthcare as our flagship vertical — serviced end-to-end by TechBucket."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => {
            const items = industry.services
              .map((id) => serviceById.get(id))
              .filter((s): s is NonNullable<typeof s> => !!s)
              .slice(0, 3);
            return (
              <Link
                key={industry.id}
                href={industry.productsOnly ? "/products" : `/industries#${industry.id}`}
                className="group reveal relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-50 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-300 text-white shadow-lg shadow-brand-500/25 transition-transform group-hover:scale-110">
                  <Icon name={industry.icon} className="h-7 w-7" />
                </div>
                <h3 className="relative mt-6 text-xl font-bold text-ink group-hover:text-brand-700">
                  {industry.name}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                  {industry.description}
                </p>
                {items.length > 0 ? (
                  <ul className="relative mt-5 space-y-2">
                    {items.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700"
                      >
                        <Icon name="check" className="h-4 w-4 text-brand-600" />
                        {s.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                    <Icon name="cart" className="h-3.5 w-3.5" />
                    Hardware products
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/industries"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            View all industries
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Products({
  products,
}: {
  products: { id: string; slug: string; name: string; summary: string; images: string[]; price: number; salePrice: number | null; purchaseType: string }[];
}) {
  const featured = products
    .filter((p) => (p as { featured?: boolean }).featured)
    .slice(0, 3);
  const items = featured.length > 0 ? featured : products.slice(0, 3);

  return (
    <section id="products" className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Shop"
          title="Featured Infrastructure Products"
          description="Servers, networking, storage, VDI and power protection — available now with delivery and support across Nepal."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group reveal flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand-50/60 to-white p-6">
                {(product as { featured?: boolean }).featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    Featured
                  </span>
                )}
                <Image
                  src={product.images[0] ?? "/images/products/placeholder.svg"}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-base font-bold text-ink group-hover:text-brand-700">
                  {product.name}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {product.summary}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-brand-700">
                    {product.purchaseType === "quote"
                      ? "Price on request"
                      : product.salePrice
                        ? formatNPR(product.salePrice)
                        : formatNPR(product.price)}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    Shop now
                    <Icon name="arrow" className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            View all products
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Cases({
  cases,
}: {
  cases: {
    eyebrow: string;
    title: string;
    description: string;
    items: { icon: string; title: string; summary: string; href: string }[];
  };
}) {
  if (cases.items.length === 0) return null;
  return (
    <section id="work" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={cases.eyebrow}
          title={cases.title}
          description={cases.description}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cases.items.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group reveal rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-surface p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-300 text-white shadow-lg shadow-brand-500/25 transition-transform group-hover:scale-110">
                <Icon name={c.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-ink group-hover:text-brand-700">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                Learn more
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process({
  process,
  site,
}: {
  process: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { icon: string; title: string; description: string }[];
  };
  site: Awaited<ReturnType<typeof getSite>>;
}) {
  return (
    <section id="process" className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={process.eyebrow}
          title={process.title}
          description={process.description}
        />
        {process.steps.length > 0 && (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {process.steps.map((step, i) => (
              <div
                key={step.title}
                className="reveal relative rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-surface p-7 shadow-sm"
              >
                <span className="absolute right-6 top-6 text-5xl font-bold text-slate-100">
                  {i + 1}
                </span>
                {i < process.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-600 shadow-sm lg:flex"
                  >
                    <Icon name="arrow" className="h-4 w-4" />
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {site.values.map((value) => (
            <div
              key={value.title}
              className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-300 text-white shadow-lg shadow-brand-500/25">
                <Icon name="spark" className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{value.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({
  testimonials,
}: {
  testimonials: {
    eyebrow: string;
    title: string;
    description: string;
    items: { quote: string; name: string; org: string }[];
  };
}) {
  if (testimonials.items.length === 0) return null;
  return (
    <section id="testimonials" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={testimonials.eyebrow}
          title={testimonials.title}
          description={testimonials.description}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.items.map((t, i) => {
            const initials = t.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <figure
                key={i}
                className="reveal relative flex flex-col rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-surface p-8 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-4 font-serif text-6xl leading-none text-brand-200"
                >
                  “
                </span>
                <div className="flex gap-1 text-brand-500">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg
                      key={s}
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-slate-600">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-300 text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.org}</p>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Faq({
  faq,
}: {
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: { question: string; answer: string }[];
  };
}) {
  if (faq.items.length === 0) return null;
  return (
    <section id="faq" className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={faq.eyebrow}
          title={faq.title}
          description={faq.description}
        />
        <div className="mt-12 space-y-4">
          {faq.items.map((item) => (
            <details
              key={item.question}
              className="accordion group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm open:border-brand-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="text-base font-semibold text-ink">
                  {item.question}
                </span>
                <span className="accordion-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icon name="plus" className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Insights({
  insights,
}: {
  insights: {
    eyebrow: string;
    title: string;
    description: string;
    items: { eyebrow: string; title: string; excerpt: string; href: string }[];
  };
}) {
  if (insights.items.length === 0) return null;
  return (
    <section id="insights" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={insights.eyebrow}
          title={insights.title}
          description={insights.description}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {insights.items.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group reveal flex flex-col rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
            >
              <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {item.eyebrow}
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-ink group-hover:text-brand-700">
                {item.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                {item.excerpt}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                Read more
                <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  return (
    <section className="bg-surface py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-slate-900 px-8 py-14 text-center shadow-2xl sm:px-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,96,32,0.4),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(240,96,32,0.3),transparent_45%)]"
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to build something great together?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
              {site.contact.subheading}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-50"
              >
                Get in Touch
                <Icon name="arrow" className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${site.contact.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Email us
                <Icon name="mail" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  return (
    <section id="contact" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="reveal">
          <SectionHeading
            align="left"
            eyebrow="Contact"
            title={site.contact.heading}
            description={site.contact.subheading}
          />
          <ul className="mt-8 space-y-5">
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="pin" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Address</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {site.contact.address}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="mail" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Email</p>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="mt-1 block text-sm text-brand-700 transition-colors hover:text-brand-800"
                >
                  {site.contact.email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="phone" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Phone</p>
                {site.contact.phones.map((phone) => (
                  <a
                    key={phone.href}
                    href={phone.href}
                    className="mt-1 block text-sm text-brand-700 transition-colors hover:text-brand-800"
                  >
                    {phone.label}
                  </a>
                ))}
              </div>
            </li>
          </ul>
        </div>

        <div className="reveal">
          <div className="rounded-3xl border border-slate-100 bg-surface p-8 shadow-sm">
            <ContactForm email={site.contact.email} />
          </div>
        </div>
      </div>
    </section>
  );
}
