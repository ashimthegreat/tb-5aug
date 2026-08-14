import "server-only";

import type { AdminRole } from "./admin";
import { listFulfillment } from "./fulfillment";
import { listOrders } from "./orders";
import { paymentStatus } from "./payment";
import { readJson } from "./store";

interface SupportTicket {
  status: string;
}

export interface NotificationCounts {
  counts: Record<string, number>;
  total: number;
}

const ACTIVE_STATUSES = ["new", "preparing", "ready"];

export async function buildNotifications(
  role: AdminRole
): Promise<NotificationCounts> {
  const counts: Record<string, number> = {};
  const add = (tab: string, n: number) => {
    if (n > 0) counts[tab] = (counts[tab] ?? 0) + n;
  };

  if (role === "superadmin" || role === "sales" || role === "saleshead") {
    const orders = await listOrders();
    add(
      "orders",
      orders.filter((o) => o.quoteStatus !== "quoted").length
    );
  }

  const fulfillment = await listFulfillment();

  const active = fulfillment.filter((o) =>
    ACTIVE_STATUSES.includes(o.status)
  ).length;

  if (
    role === "superadmin" ||
    role === "sales" ||
    role === "saleshead" ||
    role === "logistics"
  ) {
    add("fulfillment", active);
  }

  if (role === "sales" || role === "saleshead") {
    add(
      "fulfillment",
      fulfillment.filter((o) => o.status === "delivered" && !o.billNo).length
    );
  }

  if (role === "superadmin" || role === "support") {
    add(
      "fulfillment",
      fulfillment.filter((o) => o.status === "ready" && !o.verifiedAt).length
    );
  }

  if (role === "superadmin") {
    add(
      "ledger",
      fulfillment.filter(
        (o) =>
          (o.billNo &&
            o.status !== "cancelled" &&
            paymentStatus(o) !== "received") ||
          (o.status === "delivered" && !o.billNo)
      ).length
    );
  }

  if (role === "logistics") {
    add(
      "fulfillment",
      fulfillment.filter(
        (o) =>
          o.billNo &&
          o.status !== "cancelled" &&
          paymentStatus(o) !== "received"
      ).length
    );
  }

  if (role === "superadmin" || role === "support") {
    try {
      const tickets = await readJson<SupportTicket[]>("tickets.json");
      add(
        "support",
        tickets.filter((t) => t.status !== "resolved").length
      );
    } catch {
      // no tickets file yet
    }
  }

  let total = 0;
  for (const n of Object.values(counts)) total += n;

  return { counts, total };
}