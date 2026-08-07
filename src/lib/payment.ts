export type PaymentMethod = "bank" | "cash" | "online" | "transfer";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "bank",
  "cash",
  "online",
  "transfer",
];

export interface PaymentRecord {
  amount: number;
  at: string;
  by: string;
  note?: string;
  method?: PaymentMethod;
  ref?: string;
  receiptNo?: string;
  voided?: boolean;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
}

export type PaymentStatus = "pending" | "partial" | "overdue" | "received";

export type AgingBucket = "current" | "0-30" | "31-60" | "60+";

export const DEFAULT_PAYMENT_DAYS = 30;

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function activePayments(order: {
  payments?: PaymentRecord[];
}): PaymentRecord[] {
  return (order.payments ?? []).filter((p) => !p.voided);
}

export function paidTotal(order: {
  total: number;
  payments?: PaymentRecord[];
}): number {
  return activePayments(order).reduce((s, p) => s + (p.amount || 0), 0);
}

export function remaining(order: {
  total: number;
  payments?: PaymentRecord[];
}): number {
  return Math.round((order.total - paidTotal(order)) * 100) / 100;
}

export function hasDueDatePassed(order: { paymentDueDate?: string }): boolean {
  if (!order.paymentDueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return order.paymentDueDate < today;
}

export function paymentStatus(order: {
  total: number;
  payments?: PaymentRecord[];
  paymentDueDate?: string;
}): PaymentStatus {
  const paid = paidTotal(order);
  if (paid >= order.total) return "received";
  if (paid > 0) return "partial";
  return hasDueDatePassed(order) ? "overdue" : "pending";
}

export function daysPastDue(order: {
  total: number;
  payments?: PaymentRecord[];
  paymentDueDate?: string;
}): number {
  if (!order.paymentDueDate || paymentStatus(order) === "received") return 0;
  const due = new Date(`${order.paymentDueDate}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return Math.max(0, days);
}

export function agingBucket(order: {
  total: number;
  payments?: PaymentRecord[];
  paymentDueDate?: string;
}): AgingBucket {
  const days = daysPastDue(order);
  if (days <= 0) return "current";
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  return "60+";
}
