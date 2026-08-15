import type { Metadata } from "next";
import Link from "next/link";
import { getCareers } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import CTABanner from "@/components/CTABanner";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join TechBucket and help build the future of technology in Nepal — with healthcare as our flagship mission. We're looking for passionate people who want to use technology to make a difference.",
};

export default async function CareersPage() {
  const careers = await getCareers();

  return (
    <>
      <PageHeader
        eyebrow="Join Our Team"
        title="Build the Future of Technology — Healthcare at the Core"
        description="We're looking for passionate people who want to use technology to improve healthcare and strengthen organisations across Nepal. Come work on problems that matter."
        breadcrumb="Careers"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {careers.perks.map((perk) => (
              <div
                key={perk.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-200/50"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(240,96,32,0.18),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={perk.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">
                    {perk.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {perk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {careers.positionsTitle}
            </h2>
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-surface p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon name="users" className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">
                {careers.emptyTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                {careers.emptyMessage}
              </p>
              <Link
                href="/#contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {careers.emptyCta}
                <Icon name="send" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <CTABanner
        title={careers.speculativeTitle}
        description={careers.speculativeMessage}
        cta={careers.speculativeCta}
      />
    </>
  );
}
