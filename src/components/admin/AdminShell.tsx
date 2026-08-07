"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteEditor from "./SiteEditor";
import ServicesEditor from "./ServicesEditor";
import CareersEditor from "./CareersEditor";
import CollectionEditor from "./CollectionEditor";
import SupportEditor from "./SupportEditor";
import UsersEditor from "./UsersEditor";
import CustomersEditor from "./CustomersEditor";
import SentLogEditor from "./SentLogEditor";
import OrdersEditor from "./OrdersEditor";
import MyProfileEditor from "./MyProfileEditor";
import DiscountsEditor from "./DiscountsEditor";
import type { AdminRole } from "@/lib/admin";

export interface ShellUser {
  name: string;
  username: string;
  email?: string;
  smtpHost?: string;
  smtpPort?: number | null;
  signatory?: string;
  designation?: string;
  signature?: string;
  role: AdminRole;
}

const tabs: { id: string; label: string; roles: AdminRole[] }[] = [
  { id: "content", label: "Content", roles: ["superadmin", "content"] },
  { id: "services", label: "Services", roles: ["superadmin", "content"] },
  { id: "products", label: "Products", roles: ["superadmin", "content", "sales"] },
  { id: "product-categories", label: "Product Categories", roles: ["superadmin", "content", "sales"] },
  { id: "brands", label: "Brands", roles: ["superadmin", "content", "sales"] },
  { id: "partners", label: "Partners", roles: ["superadmin", "content", "sales"] },
  { id: "careers", label: "Careers", roles: ["superadmin", "content"] },
  { id: "customers", label: "Customers", roles: ["superadmin", "sales"] },
  { id: "orders", label: "Orders & Requests", roles: ["superadmin", "sales"] },
  { id: "sent-log", label: "Sent Log", roles: ["superadmin"] },
  { id: "support", label: "Support", roles: ["superadmin", "support"] },
  { id: "profile", label: "My Profile", roles: ["superadmin", "content", "sales", "support"] },
  { id: "discounts", label: "Discounts", roles: ["superadmin"] },
  { id: "users", label: "Users", roles: ["superadmin"] },
];

export default function AdminShell({ user }: { user: ShellUser }) {
  const allowedTabs = useMemo(
    () => tabs.filter((t) => t.roles.includes(user.role)),
    [user.role]
  );
  const [tab, setTab] = useState<string>(allowedTabs[0]?.id ?? "content");
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
              Signed in as{" "}
              <span className="font-medium text-slate-700">
                {user.name} ({user.role})
              </span>
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
          {allowedTabs.map((t) => (
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
          {tab === "product-categories" && (
            <CollectionEditor resource="product-categories" />
          )}
          {tab === "brands" && <CollectionEditor resource="brands" />}
          {tab === "partners" && <CollectionEditor resource="partners" />}
          {tab === "careers" && <CareersEditor />}
          {tab === "customers" && <CustomersEditor user={user} />}
          {tab === "orders" && <OrdersEditor />}
          {tab === "sent-log" && <SentLogEditor />}
          {tab === "support" && <SupportEditor />}
          {tab === "profile" && <MyProfileEditor user={user} />}
          {tab === "discounts" && <DiscountsEditor />}
          {tab === "users" && <UsersEditor currentUsername={user.username} />}
        </div>
      </div>
    </div>
  );
}
