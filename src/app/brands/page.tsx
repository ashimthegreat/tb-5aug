import type { Metadata } from "next";
import { getBrands } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BrandCard from "@/components/BrandCard";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Technology Partners",
  description:
    "TechBucket partners with leading technology brands — Oracle Health, Aruba, Imprivata, Medisha, Dell and Accops — to deliver the best solutions for healthcare in Nepal.",
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <>
      <PageHeader
        eyebrow="Technology Partners"
        title="Backed by the Best in the Industry"
        description="We partner with leading technology brands to deliver world-class solutions — from enterprise health records to secure networking infrastructure."
        breadcrumb="Technology Partners"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </div>
      </section>
      <CTABanner
        title="Interested in partnering with us?"
        description="We're always open to new collaborations that advance healthcare technology."
        cta="Get in Touch"
      />
    </>
  );
}
