import type { Metadata } from "next";
import { getIndustries, getServices } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import ServiceCard from "@/components/ServiceCard";
import CTABanner from "@/components/CTABanner";
import { Icon } from "@/components/icons";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Hospital software for healthcare and genuine IT infrastructure products for every industry — education, finance, hospitality, manufacturing, retail and more. Built by TechBucket in Nepal.",
};

export default async function IndustriesPage() {
  const [industries, services] = await Promise.all([
    getIndustries(),
    getServices(),
  ]);

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const sortedIndustries = [...industries].sort((a, b) => a.order - b.order);

  return (
    <>
      <PageHeader
        eyebrow="Industries"
        title="Solutions by Industry"
        description="Hospital management software for healthcare providers, and genuine IT infrastructure products for every other industry — delivered end-to-end by TechBucket."
        breadcrumb="Industries"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6 lg:px-8">
          {sortedIndustries.map((industry) => {
            const items = industry.services
              .map((id) => serviceById.get(id))
              .filter((s): s is NonNullable<typeof s> => !!s);
            return (
              <div key={industry.id} id={industry.id} className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Icon name={industry.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                      {industry.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-slate-600">
                      {industry.description}
                    </p>
                  </div>
                </div>
                {items.length > 0 ? (
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
                ) : (
                  <ProductsOnlyPanel industry={industry.name} />
                )}
              </div>
            );
          })}
          {industries.length === 0 && (
            <p className="text-center text-slate-500">
              No industries yet.
            </p>
          )}
        </div>
      </section>
      <CTABanner
        title="Not sure what you need?"
        description="Tell us your goals — our team will recommend the right hospital software or IT infrastructure products for your organisation."
        cta="Get in Touch"
      />
    </>
  );
}

function ProductsOnlyPanel({ industry }: { industry: string }) {
  return (
    <div className="mt-8 flex flex-col items-start justify-between gap-6 rounded-3xl border border-brand-100 bg-brand-50/60 p-8 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
          <Icon name="cart" className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-ink">
            IT infrastructure products only
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            For the {industry} sector we supply genuine IT hardware — servers,
            networking, storage, VDI and power protection — delivered and
            supported across Nepal.
          </p>
        </div>
      </div>
      <Link
        href="/products"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
      >
        Browse products
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}