import "server-only";
import { readJson } from "./store";

export interface CustomerQuote {
  id: string;
  quoteNo?: string;
  to: string;
  subject: string;
  items?: {
    type: "item" | "service";
    description: string;
    qty: number;
    price: number;
  }[];
  vatRate?: number;
  subtotal?: number;
  vat?: number;
  total?: number;
  notes?: string;
  sentBy: string;
  sentAt: string;
  status: "sent" | "failed";
  orderId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  quotes?: CustomerQuote[];
}

export async function listCustomers(): Promise<Customer[]> {
  try {
    return await readJson<Customer[]>("customers.json");
  } catch {
    return [];
  }
}

export function normalizePhone(phone: string | undefined | null): string {
  return (phone ?? "")
    .trim()
    .replace(/^\+?9?7?7?/, "")
    .replace(/\D/g, "");
}

export function findCustomer(
  customers: Customer[],
  phone?: string | null,
  email?: string | null
): Customer | null {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    const byPhone = customers.find(
      (c) => normalizePhone(c.phone) === normalizedPhone
    );
    if (byPhone) return byPhone;
  }
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  if (normalizedEmail) {
    const byEmail = customers.find(
      (c) => (c.email ?? "").trim().toLowerCase() === normalizedEmail
    );
    if (byEmail) return byEmail;
  }
  return null;
}