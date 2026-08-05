import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import SupportForm from "@/components/SupportForm";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Need help with a TechBucket product or service? Raise a support ticket and our team will get back to you quickly.",
};

export default async function SupportPage() {
  const site = await getSite();

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="How Can We Help?"
        description="Raise a support ticket and our team will respond to you as soon as possible — usually within one business day."
        breadcrumb="Support"
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-2xl font-bold text-ink">Support Options</h2>
              <ul className="mt-6 space-y-5">
                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Email</p>
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="mt-1 block text-sm text-brand-700 transition-colors hover:text-brand-800"
                    >
                      {site.contact.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name="phone" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Phone</p>
                    {site.contact.phones.map((phone) => (
                      <a
                        key={phone.href}
                        href={phone.href}
                        className="mt-1 block text-sm text-brand-700 transition-colors hover:text-brand-800"
                      >
                        {phone.label}
                      </a>
                    ))}
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name="pin" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Office</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {site.contact.address}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name="clock" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Response time</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Within one business day. Urgent issues are prioritised.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <SupportForm />
          </div>
        </div>
      </section>
    </>
  );
}
