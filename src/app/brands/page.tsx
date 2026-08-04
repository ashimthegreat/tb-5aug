import type { Metadata } from "next";
import { brands } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import BrandCard from "@/components/BrandCard";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Our Brands",
  description:
    "TechBucket develops and maintains a portfolio of healthcare and technology products trusted across Nepal — Oracle Health, Aruba, Imprivata, Medisha, Dell and Accops.",
};

export default function BrandsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Brands"
        title="The Products We Build"
        description="TechBucket develops and maintains a portfolio of healthcare and technology products trusted across Nepal."
        breadcrumb="Brands"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandCard key={brand.name} brand={brand} />
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
