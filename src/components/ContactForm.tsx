"use client";

import { useState } from "react";
import { Icon } from "./icons";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export default function ContactForm({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const visitorEmail = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const body = [
      `Name: ${name}`,
      `Email: ${visitorEmail}`,
      "",
      message,
    ].join("\n");

    const mailto = `mailto:${email}?subject=${encodeURIComponent(
      subject || "Website enquiry"
    )}&body=${encodeURIComponent(body)}`;

    setSending(true);
    window.location.href = mailto;
    setSending(false);
    setSent(true);
    form.reset();
  }

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-ink">Message Ready!</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          Your email client should have opened with your message addressed to{" "}
          <span className="font-semibold text-ink">{email}</span>. Just hit send
          and our team will respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h3 className="text-xl font-bold text-ink">Send us a Message</h3>
      <p className="mt-1 text-sm text-slate-500">
        Fields marked * are required.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Full Name *
          </label>
          <input id="name" name="name" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">
          Subject *
        </label>
        <input id="subject" name="subject" required className={inputClasses} />
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`${inputClasses} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {sending ? "Preparing…" : "Send Message"}
        <Icon name="send" className="h-4 w-4" />
      </button>
    </form>
  );
}
