import { site, stats, trustPoints, services, values } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import ContactForm from "@/components/ContactForm";
import { Icon } from "@/components/icons";

export const metadata = {
  title: "Healthcare IT Solutions in Nepal",
  description:
    "TechBucket builds modern, reliable software for hospitals and clinics in Nepal — hospital management systems, LIS, mobile health apps and more.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <About />
      <Stats />
      <Services />
      <Vision />
      <Contact />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-surface to-white">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Trusted healthcare IT partner since {site.founded}
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Powering Healthcare Through Technology
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            We build modern, reliable software solutions for healthcare providers
            in Nepal and beyond. Trusted by clinics, hospitals and health
            organisations across the Kathmandu Valley.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto"
            >
              Get Started
              <Icon name="arrow" className="h-4 w-4" />
            </a>
            <a
              href="#about"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 sm:w-auto"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
      <ScrollHint />
    </section>
  );
}

function ScrollHint() {
  return (
    <div className="flex justify-center pb-8">
      <a
        href="#about"
        className="inline-flex flex-col items-center gap-1 text-xs font-medium uppercase tracking-widest text-slate-400 transition-colors hover:text-brand-600"
      >
        Scroll
        <svg
          className="h-4 w-4 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map((point) => (
          <div key={point.title} className="flex items-start gap-4 px-4 py-8">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name="check" className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{point.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="About Us"
              title="Transforming Healthcare with Smart Technology"
            />
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              {site.name} Pvt. Ltd. is a Nepal-based healthcare IT and software
              development company. We design, build, and maintain digital
              solutions that improve patient outcomes, streamline clinical
              workflows, and empower healthcare organisations to deliver better
              care.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Founded in {site.founded}, we have grown from a small startup to a
              trusted partner for hospitals, clinics, and health startups across
              Nepal.
            </p>
            <a
              href="#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Work with us
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <p className="text-4xl font-bold text-brand-700">
                {stats[0].value}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {stats[0].label}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-4xl font-bold text-ink">{stats[1].value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {stats[1].label}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-4xl font-bold text-ink">{stats[2].value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {stats[2].label}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <p className="text-4xl font-bold text-brand-700">
                {stats[3].value}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {stats[3].label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-4xl font-bold text-brand-400 sm:text-5xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Solutions Built for Healthcare"
          description="From hospital management systems to mobile health apps, we deliver end-to-end digital solutions."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Vision() {
  return (
    <section id="vision" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What Drives Us"
          title="What Drives Us Forward"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-slate-900 p-8 text-white lg:row-span-2">
            <h3 className="text-xl font-bold">{values[0].title}</h3>
            <p className="mt-3 leading-relaxed text-brand-100">{values[0].body}</p>
            <div className="my-8 h-px bg-white/20" />
            <h3 className="text-xl font-bold">{values[1].title}</h3>
            <p className="mt-3 leading-relaxed text-brand-100">{values[1].body}</p>
          </div>
          {values.slice(2).map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-ink">{value.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Contact"
              title="Let's Build Something Great Together"
              description="Looking to build better software for your healthcare organisation? Write to us and our team will respond within 24 hours."
            />
            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name="pin" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Address</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {site.address}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name="mail" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Email</p>
                  <a
                    href={`mailto:${site.email}`}
                    className="mt-1 block text-sm text-brand-700 transition-colors hover:text-brand-800"
                  >
                    {site.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name="phone" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Phone</p>
                  {site.phones.map((phone) => (
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
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
