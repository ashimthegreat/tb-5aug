import "server-only";
import { readJson, writeJson } from "./store";

export type OrderType = "delivery" | "pickup";

export type FulfillmentStatus =
  | "new"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface FulfillmentItem {
  type: "item" | "service";
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface FulfillmentEvent {
  at: string;
  by: string;
  role: string;
  from: string;
  to: string;
  note?: string;
  amount?: number;
  action?: "verify" | "payment";
}

export type { PaymentRecord, PaymentStatus } from "./payment";
import type { PaymentRecord } from "./payment";
export {
  DEFAULT_PAYMENT_DAYS,
  addDaysIso,
  paidTotal,
  remaining,
  hasDueDatePassed,
  paymentStatus,
} from "./payment";

export interface FulfillmentOrder {
  id: string;
  orderNo: string;
  quoteId: string;
  quoteNo: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  items: FulfillmentItem[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  vatRate: number;
  vat: number;
  total: number;
  orderType: OrderType;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  status: FulfillmentStatus;
  updatedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedNote?: string;
  billNo?: string;
  billedAt?: string;
  billedBy?: string;
  payments?: PaymentRecord[];
  paymentDueDate?: string;
  paidAt?: string;
  paidBy?: string;
  events: FulfillmentEvent[];
}

export const FULFILLMENT_FILE = "fulfillment.json";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Delivery to customer",
  pickup: "Pickup / handover to sales",
};

export const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ACTIVE_STATUSES: FulfillmentStatus[] = [
  "new",
  "preparing",
  "ready",
];

export async function listFulfillment(): Promise<FulfillmentOrder[]> {
  try {
    return await readJson<FulfillmentOrder[]>(FULFILLMENT_FILE);
  } catch {
    return [];
  }
}

export async function getFulfillment(
  id: string
): Promise<FulfillmentOrder | null> {
  const orders = await listFulfillment();
  return orders.find((o) => o.id === id) ?? null;
}

export async function saveFulfillment(
  orders: FulfillmentOrder[]
): Promise<void> {
  await writeJson(FULFILLMENT_FILE, orders);
}

export function newFulfillmentId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isVerified(order: FulfillmentOrder): boolean {
  return !!order.verifiedAt;
}

export async function nextOrderNo(): Promise<string> {
  const orders = await listFulfillment();
  const nums = orders.map(
    (o) => Number(o.orderNo?.match(/(\d+)$/)?.[1]) || 0
  );
  const next = nums.reduce((m, n) => Math.max(m, n), 0) + 1;
  return `TTR-ORD-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
}

export async function nextBillNo(): Promise<string> {
  const orders = await listFulfillment();
  const nums = orders.map(
    (o) => Number(o.billNo?.match(/(\d+)$/)?.[1]) || 0
  );
  const next = nums.reduce((m, n) => Math.max(m, n), 0) + 1;
  return `TTR-BIL-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
}
