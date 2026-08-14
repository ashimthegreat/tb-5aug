export function normalizePhone(phone: string | undefined | null): string {
  return (phone ?? "")
    .trim()
    .replace(/^\+?9?7?7?/, "")
    .replace(/\D/g, "");
}

export interface CustomerLike {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface PrefillQuoteItem {
  description: string;
  qty: number;
  price: number;
}

export interface QuotePrefill {
  customerId?: string | null;
  orderId?: string;
  items: PrefillQuoteItem[];
}

export function findCustomerLike(
  customers: CustomerLike[],
  phone?: string | null,
  email?: string | null
): CustomerLike | null {
  const p = normalizePhone(phone);
  if (p) {
    const byPhone = customers.find((c) => normalizePhone(c.phone) === p);
    if (byPhone) return byPhone;
  }
  const e = (email ?? "").trim().toLowerCase();
  if (e) {
    const byEmail = customers.find((c) => (c.email ?? "").trim().toLowerCase() === e);
    if (byEmail) return byEmail;
  }
  return null;
}