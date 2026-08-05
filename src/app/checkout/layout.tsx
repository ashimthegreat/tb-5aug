import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place your TechBucket product order by email or WhatsApp.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
