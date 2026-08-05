import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Products",
  description:
    "The products TechBucket builds and operates — from healthcare software to IT infrastructure, trusted across Nepal.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Products We Build & Operate"
        description="A portfolio of technology products developed and maintained by TechBucket, trusted by organisations across Nepal."
        breadcrumb="Products"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">
              More products are on the way.
            </p>
          )}
        </div>
      </section>
      <CTABanner
        title="Interested in one of our products?"
        description="Talk to us about deploying Infrastructure or a custom product for your organisation."
        cta="Get in Touch"
      />
    </>
  );
}
