import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { site } from "@/lib/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "TechBucket | Healthcare IT Solutions in Nepal",
    template: "%s — TechBucket",
  },
  description:
    "TechBucket is a Nepal-based healthcare IT company building modern software for hospitals, clinics and health organisations — hospital management systems, LIS, mobile health apps and more.",
  keywords: [
    "healthcare IT Nepal",
    "hospital management system Nepal",
    "TechBucket",
    "health software Nepal",
  ],
  openGraph: {
    title: "TechBucket | Healthcare IT Solutions in Nepal",
    description:
      "Powering healthcare through technology. Modern, reliable software for healthcare providers in Nepal.",
    url: site.url,
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
