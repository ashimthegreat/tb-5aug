import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/shop/CartContext";
import { getCurrentUser } from "@/lib/admin";
import { siteName, siteUrl, getSite } from "@/lib/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TechBucket | IT Services & Software Solutions in Nepal",
    template: "%s — TechBucket",
  },
  description:
    "TechBucket is a Nepal-based software and IT company delivering custom software development, cybersecurity, networking, cloud & data centre, managed IT and IT consulting solutions to healthcare, education, finance and enterprises across Nepal since 2019.",
  keywords: [
    "IT services Nepal",
    "software development Nepal",
    "hospital management system Nepal",
    "cybersecurity Nepal",
    "networking solutions Nepal",
    "cloud services Nepal",
    "managed IT services Nepal",
    "TechBucket",
    "health software Nepal",
    "IT company Kathmandu",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "TechBucket | IT Services & Software Solutions in Nepal",
    description:
      "Custom software, cybersecurity, networking, cloud and managed IT services for healthcare, education, finance and enterprises in Nepal since 2019.",
    url: siteUrl,
    siteName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechBucket | IT Services & Software Solutions in Nepal",
    description:
      "Custom software, cybersecurity, networking, cloud and managed IT services in Nepal.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const site = await getSite();
  const hideSiteChrome =
    !!user && ["sales", "saleshead", "logistics", "support"].includes(user.role);

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteName,
              url: siteUrl,
              description: site.tagline,
              telephone: site.contact.phones[0]?.label,
              email: site.contact.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: site.contact.address,
                addressCountry: "NP",
              },
              vatID: site.contact.vatNo,
              foundingDate: "2019",
              areaServed: "Nepal",
            }).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {hideSiteChrome ? (
          <CartProvider>
            <main className="flex-1">{children}</main>
          </CartProvider>
        ) : (
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        )}
      </body>
    </html>
  );
}
