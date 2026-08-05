import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CartView from "@/components/shop/CartView";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the products in your TechBucket shopping cart.",
};

export default function CartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cart"
        title="Your Cart"
        description="Review the products you've selected before placing your order."
        breadcrumb="Cart"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <CartView />
        </div>
      </section>
    </>
  );
}
