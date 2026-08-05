"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteEditor from "./SiteEditor";
import ServicesEditor from "./ServicesEditor";
import CareersEditor from "./CareersEditor";
import CollectionEditor from "./CollectionEditor";

const tabs = [
  { id: "content", label: "Content" },
  { id: "services", label: "Services" },
  { id: "products", label: "Products" },
  { id: "brands", label: "Brands" },
  { id: "partners", label: "Partners" },
  { id: "careers", label: "Careers" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminShell() {
  const [tab, setTab] = useState<TabId>("content");
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">TechBucket Admin</h1>
            <p className="text-xs text-slate-500">
              Manage site content — changes are saved to the content/ folder.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              View site
            </a>
            <button
              onClick={logout}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          {tab === "content" && <SiteEditor />}
          {tab === "services" && <ServicesEditor />}
          {tab === "products" && <CollectionEditor resource="products" />}
          {tab === "brands" && <CollectionEditor resource="brands" />}
          {tab === "partners" && <CollectionEditor resource="partners" />}
          {tab === "careers" && <CareersEditor />}
        </div>
      </div>
    </div>
  );
}
