export interface PaymentRecord {
  amount: number;
  at: string;
  by: string;
  note?: string;
}

export type PaymentStatus = "pending" | "partial" | "overdue" | "received";

export const DEFAULT_PAYMENT_DAYS = 30;

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function paidTotal(order: {
  total: number;
  payments?: PaymentRecord[];
}): number {
  return (order.payments ?? []).reduce((s, p) => s + (p.amount || 0), 0);
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
