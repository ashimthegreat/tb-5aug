"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteEditor from "./SiteEditor";
import HomeEditor from "./HomeEditor";
import ServicesEditor from "./ServicesEditor";
import CareersEditor from "./CareersEditor";
import CollectionEditor from "./CollectionEditor";
import SupportEditor from "./SupportEditor";
import UsersEditor from "./UsersEditor";
import CustomersEditor from "./CustomersEditor";
import SentLogEditor from "./SentLogEditor";
import OrdersEditor from "./OrdersEditor";
import FulfillmentEditor from "./FulfillmentEditor";
import LedgerEditor from "./LedgerEditor";
import RevenueEditor from "./RevenueEditor";
import MyProfileEditor from "./MyProfileEditor";
import DiscountsEditor from "./DiscountsEditor";
import BankAccountsEditor from "./BankAccountsEditor";
import type { AdminRole } from "@/lib/admin";
import type { CustomerDraft } from "./OrdersEditor";
import { useNotifications } from "./useNotifications";
import type { OrderRecord } from "@/lib/orders";
import type { QuotePrefill } from "@/lib/customerMatch";

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
  { id: "home", label: "Home Editor", roles: ["superadmin", "content"] },
  { id: "services", label: "Services & Categories", roles: ["superadmin", "content"] },
  { id: "products", label: "Products", roles: ["superadmin", "content", "saleshead"] },
  { id: "product-categories", label: "Product Categories", roles: ["superadmin", "content", "saleshead"] },
  { id: "brands", label: "Brands", roles: ["superadmin", "content", "saleshead"] },
  { id: "partners", label: "Partners", roles: ["superadmin", "content", "saleshead"] },
  { id: "careers", label: "Careers", roles: ["superadmin", "content"] },
  { id: "customers", label: "Customers", roles: ["superadmin", "saleshead"] },
  { id: "orders", label: "Orders & Requests", roles: ["superadmin", "sales", "saleshead"] },
  { id: "fulfillment", label: "Fulfillment", roles: ["superadmin", "sales", "saleshead", "logistics", "support"] },
  { id: "ledger", label: "Ledger", roles: ["superadmin"] },
  { id: "revenue", label: "Reports", roles: ["superadmin"] },
  { id: "sent-log", label: "Sent Log", roles: ["superadmin"] },
  { id: "support", label: "Support", roles: ["superadmin", "support"] },
  { id: "profile", label: "My Profile", roles: ["superadmin", "content", "sales", "saleshead", "support", "logistics"] },
  { id: "discounts", label: "Discounts", roles: ["superadmin"] },
  { id: "bank-accounts", label: "Bank Accounts", roles: ["superadmin"] },
  { id: "users", label: "Users", roles: ["superadmin"] },
];

export default function AdminShell({ user }: { user: ShellUser }) {
  const allowedTabs = useMemo(
    () => tabs.filter((t) => t.roles.includes(user.role)),
    [user.role]
  );
  const [tab, setTab] = useState<string>(allowedTabs[0]?.id ?? "content");
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft | null>(null);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill | null>(null);
  const [jump, setJump] = useState<{ tab: string; id: string } | null>(null);
  const { counts } = useNotifications();
  const router = useRouter();

  function openTab(tab: string, id: string) {
    setTab(tab);
    setJump({ tab, id });
  }

  function requestNewCustomer(draft: CustomerDraft) {
    setCustomerDraft(draft);
    setQuotePrefill(
      draft.orderId
        ? { orderId: draft.orderId, items: draft.orderItems ?? [] }
        : null
    );
    setTab("customers");
  }

  function requestQuoteForOrder(order: OrderRecord, customerId: string) {
    setCustomerDraft(null);
    setQuotePrefill({
      customerId,
      orderId: order.id,
      items: order.items.map((it) => ({
        description: it.name,
        qty: it.qty,
        price: it.price,
      })),
    });
    setTab("customers");
  }

  const canManageCustomers =
    user.role === "superadmin" || user.role === "saleshead";

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
            {["superadmin", "content"].includes(user.role) && (
              <a
                href="/"
                target="_blank"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View site
              </a>
            )}
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
          {allowedTabs.map((t) => {
            const count = counts[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-brand-600 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.label}
                {!!count && count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          {tab === "content" && <SiteEditor />}
          {tab === "home" && <HomeEditor />}
          {tab === "services" && <ServicesEditor />}
          {tab === "products" && <CollectionEditor resource="products" />}
          {tab === "product-categories" && (
            <CollectionEditor resource="product-categories" />
          )}
          {tab === "brands" && <CollectionEditor resource="brands" />}
          {tab === "partners" && <CollectionEditor resource="partners" />}
          {tab === "careers" && <CareersEditor />}
          {tab === "customers" && (
            <CustomersEditor
              user={user}
              initialDraft={customerDraft}
              onDraftHandled={() => setCustomerDraft(null)}
              quotePrefill={quotePrefill}
              onQuotePrefillHandled={() => setQuotePrefill(null)}
              onJumpTo={openTab}
            />
          )}
          {tab === "orders" && (
            <OrdersEditor
              user={user}
              onAddCustomer={canManageCustomers ? requestNewCustomer : undefined}
              onSendQuote={canManageCustomers ? requestQuoteForOrder : undefined}
              focusOrderId={jump?.tab === "orders" ? jump.id : undefined}
              onFocusHandled={() => setJump(null)}
            />
          )}
          {tab === "fulfillment" && (
            <FulfillmentEditor
              user={user}
              focusOrderId={jump?.tab === "fulfillment" ? jump.id : undefined}
              onFocusHandled={() => setJump(null)}
            />
          )}
          {tab === "ledger" && <LedgerEditor />}
          {tab === "revenue" && <RevenueEditor />}
          {tab === "sent-log" && <SentLogEditor />}
          {tab === "support" && <SupportEditor />}
          {tab === "profile" && <MyProfileEditor user={user} />}
          {tab === "discounts" && <DiscountsEditor />}
          {tab === "bank-accounts" && <BankAccountsEditor />}
          {tab === "users" && <UsersEditor currentUsername={user.username} />}
        </div>
      </div>
    </div>
  );
}
