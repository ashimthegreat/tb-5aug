import type { Metadata } from "next";
import { getCategories, getServices } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import ServiceCard from "@/components/ServiceCard";
import CTABanner from "@/components/CTABanner";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Software and infrastructure services organised by industry — healthcare, infrastructure and more. Built by TechBucket in Nepal.",
};

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([
    getCategories(),
    getServices(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Solutions by Industry"
        description="From hospital management systems to IT infrastructure — our services are organised by industry so you can find the right solution fast."
        breadcrumb="Services"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6 lg:px-8">
          {categories.map((category) => {
            const items = services
              .filter((s) => s.categoryId === category.id)
              .sort((a, b) => a.order - b.order);
            return (
              <div key={category.id} id={category.id} className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Icon name={category.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                      {category.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-slate-600">
                      {category.description}
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
                  <p className="mt-8 text-sm text-slate-500">
                    More services in this category are on the way.
                  </p>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <p className="text-center text-slate-500">
              No service categories yet.
            </p>
          )}
        </div>
      </section>
      <CTABanner
        title="Need a solution not listed here?"
        description="We build custom software and infrastructure for any industry. Tell us what you need."
        cta="Get in Touch"
      />
    </>
  );
}
