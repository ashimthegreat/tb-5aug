import type { Metadata } from "next";
import Link from "next/link";
import { careerPerks } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import CTABanner from "@/components/CTABanner";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join TechBucket and help build the future of healthcare IT in Nepal. We're looking for passionate people who want to use technology to improve healthcare.",
};

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Join Our Team"
        title="Build the Future of Healthcare IT"
        description="We're looking for passionate people who want to use technology to improve healthcare in Nepal. Come work on problems that matter."
        breadcrumb="Careers"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {careerPerks.map((perk) => (
              <div
                key={perk.title}
                className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
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
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Open Positions
            </h2>
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-surface p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon name="users" className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">
                No open positions right now
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                We&apos;re not actively hiring at the moment, but we&apos;d love
                to hear from talented developers, designers, and healthcare IT
                professionals.
              </p>
              <Link
                href="/#contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Send your CV anyway
                <Icon name="send" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <CTABanner
        title="Don't see the right role?"
        description="We love hearing from talented people. Send us your CV and tell us what you'd like to work on."
        cta="Send a Speculative Application"
      />
    </>
  );
}
