import type { Metadata } from "next";
import { getPartners } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import PartnerCard from "@/components/PartnerCard";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Our Partners",
  description:
    "We collaborate with leading organisations to deliver the best technology and services for healthcare in Nepal — hospitals, medical colleges and government institutions.",
};

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <>
      <PageHeader
        eyebrow="Our Partners"
        title="Built on Trusted Partnerships"
        description="We collaborate with leading organisations to deliver the best technology and services for healthcare in Nepal."
        breadcrumb="Partners"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      </section>
      <CTABanner
        title="Become a Partner"
        description="Let's work together to bring better healthcare technology to Nepal. We welcome partnerships with hospitals, clinics, tech companies, and NGOs."
        cta="Let's Talk"
      />
    </>
  );
}
