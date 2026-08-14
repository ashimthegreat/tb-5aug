"use client";

import { useCallback, useEffect, useState } from "react";

export interface NotificationCounts {
  counts: Record<string, number>;
  total: number;
}

interface NotificationPayload {
  counts: Record<string, number>;
  total: number;
}

async function fetchCounts(): Promise<NotificationCounts> {
  const res = await fetch("/api/admin/notifications", { cache: "no-store" });
  if (!res.ok) return { counts: {}, total: 0 };
  const body = await res.json();
  const data = body.data as NotificationPayload | undefined;
  return data ?? { counts: {}, total: 0 };
}

export function useNotifications() {
  const [data, setData] = useState<NotificationCounts>({
    counts: {},
    total: 0,
  });

  const refresh = useCallback(() => {
    fetchCounts().then((next) => setData(next));
  }, []);

  useEffect(() => {
    fetchCounts().then((next) => setData(next));
    const id = setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return { counts: data.counts, total: data.total, refresh };
}