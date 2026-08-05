import { getSite, getCategories, getServices, getProducts } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import ContactForm from "@/components/ContactForm";
import { Icon } from "@/components/icons";
import { formatNPR } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Healthcare IT Solutions in Nepal",
  description:
    "TechBucket builds modern, reliable software and infrastructure for hospitals, clinics and other industries in Nepal.",
};

export default async function HomePage() {
  const [site, categories, services, products] = await Promise.all([
    getSite(),
    getCategories(),
    getServices(),
    getProducts(),
  ]);

  return (
    <>
      <Hero hero={site.hero} />
      <TrustBar points={site.trustPoints} />
      <About site={site} />
      <Stats stats={site.stats} />
      <Services categories={categories} services={services} />
      <Products products={products} />
      <Vision site={site} />
      <Contact site={site} />
    </>
  );
}

function Hero({ hero }: { hero: { eyebrow: string; title: string; subtitle: string } }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-surface to-white">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            {hero.eyebrow}
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            {hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
            >
              Get Started
              <Icon name="arrow" className="h-4 w-4" />
            </a>
            <a
              href="#about"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-8">
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

function TrustBar({
  points,
}: {
  points: { title: string; description: string }[];
}) {
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
        {points.map((point) => (
          <div key={point.title} className="flex items-start gap-4 px-4 py-8">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name="check" className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  return (
    <section id="about" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="About Us" title={site.about.title} />
            {site.about.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mt-6 text-lg leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
            <a
              href="#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Work with us
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {site.stats.map((stat, index) => (
              <div
                key={stat.label}
                className={
                  index % 2 === 0
                    ? "rounded-2xl border border-brand-100 bg-brand-50 p-6"
                    : "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                }
              >
                <p
                  className={
                    index % 2 === 0 ? "text-4xl font-bold text-brand-700" : "text-4xl font-bold text-ink"
                  }
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-4xl font-bold text-brand-400 sm:text-5xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Services({
  categories,
  services,
}: {
  categories: { id: string; name: string; icon: string; description: string }[];
  services: { id: string; categoryId: string; icon: string; title: string; description: string; order: number }[];
}) {
  return (
    <section id="services" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Solutions Built for Every Industry"
          description="From hospital management systems to IT infrastructure, we deliver end-to-end digital solutions."
        />
        {categories.map((category) => {
          const items = services
            .filter((s) => s.categoryId === category.id)
            .sort((a, b) => a.order - b.order);
          if (items.length === 0) return null;
          return (
            <div key={category.id} className="mt-14">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Icon name={category.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-ink">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.description}</p>
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
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            View all services
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
  products: { id: string; slug: string; name: string; summary: string; images: string[]; price: number; salePrice: number | null }[];
}) {
  const featured = products
    .filter((p) => (p as { featured?: boolean }).featured)
    .slice(0, 3);
  const items = featured.length > 0 ? featured : products.slice(0, 3);

  return (
    <section id="products" className="bg-white py-20 sm:py-24">
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
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-brand-50/40 p-6">
                <Image
                  src={product.images[0] ?? "/images/products/placeholder.svg"}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold text-ink group-hover:text-brand-700">
                  {product.name}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {product.summary}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-brand-700">
                    {product.salePrice
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
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            View all products
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Vision({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  return (
    <section id="vision" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="What Drives Us" title="What Drives Us Forward" />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-slate-900 p-8 text-white lg:row-span-2">
            <h3 className="text-xl font-bold">{site.mission.title}</h3>
            <p className="mt-3 leading-relaxed text-brand-100">{site.mission.body}</p>
            <div className="my-8 h-px bg-white/20" />
            <h3 className="text-xl font-bold">{site.vision.title}</h3>
            <p className="mt-3 leading-relaxed text-brand-100">{site.vision.body}</p>
          </div>
          {site.values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-ink">{value.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ site }: { site: Awaited<ReturnType<typeof getSite>> }) {
  return (
    <section id="contact" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
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

          <ContactForm email={site.contact.email} />
        </div>
      </div>
    </section>
  );
}
