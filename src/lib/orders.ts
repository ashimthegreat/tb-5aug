import "server-only";
import { readJson, writeJson } from "./store";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface OrderRecord {
  id: string;
  type: "quote-request" | "order";
  channel?: "email" | "whatsapp";
  items: OrderItem[];
  subtotal?: number;
  customerName: string;
  email: string;
  phone?: string;
  note?: string;
  createdAt: string;
}

const FILE = "orders.json";

export async function listOrders(): Promise<OrderRecord[]> {
  try {
    return await readJson<OrderRecord[]>(FILE);
  } catch {
    return [];
  }
}

export async function appendOrder(record: OrderRecord): Promise<void> {
  const orders = await listOrders();
  orders.push(record);
  await writeJson(FILE, orders);
}

export function newOrderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
