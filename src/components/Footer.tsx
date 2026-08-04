import Link from "next/link";
import { site } from "@/lib/data";
import { Icon } from "./icons";
import Logo from "./Logo";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Vision & Mission", href: "/#vision" },
  { label: "Brands", href: "/brands" },
  { label: "Partners", href: "/partners" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo className="brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              {site.tagline}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              {site.address}
              <br />
              VAT No.: {site.vatNo}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-brand-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span className="text-slate-400">{site.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="mail" className="h-4 w-4 shrink-0 text-brand-400" />
                <a
                  href={`mailto:${site.email}`}
                  className="text-slate-400 transition-colors hover:text-brand-300"
                >
                  {site.email}
                </a>
              </li>
              {site.phones.map((phone) => (
                <li key={phone.href} className="flex items-center gap-3">
                  <Icon name="phone" className="h-4 w-4 shrink-0 text-brand-400" />
                  <a
                    href={phone.href}
                    className="text-slate-400 transition-colors hover:text-brand-300"
                  >
                    {phone.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} {site.name} Pvt. Ltd. All rights reserved.
          </p>
          <p className="mt-1">Registered in Nepal</p>
        </div>
      </div>
    </footer>
  );
}
