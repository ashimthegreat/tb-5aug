import type { Metadata } from "next";
import { getProducts, getProductCategories, getBrands } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import ShopBrowser from "@/components/shop/ShopBrowser";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Shop IT infrastructure products from TechBucket — servers, networking, storage, VDI, UPS and peripherals. Prices in NPR, with buy-now and order-by-enquiry options across Nepal.",
};

export default async function ProductsPage() {
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getProductCategories(),
    getBrands(),
  ]);

  const brandName = (id: string) =>
    brands.find((b) => b.id === id)?.name ?? id;

  const enrichedProducts = products.map((p) => ({ ...p, brand: brandName(p.brand) }));

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="IT Infrastructure Products"
        description="Genuine servers, networking, storage, VDI, UPS and peripherals from trusted brands — priced in NPR, delivered and supported across Nepal."
        breadcrumb="Products"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ShopBrowser products={enrichedProducts} categories={categories} />
        </div>
      </section>
      <CTABanner
        title="Need help choosing the right product?"
        description="Our team can recommend, supply, install and support the right infrastructure for your organisation."
        cta="Talk to Us"
      />
    </>
  );
}
