"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  updateQty: (slug: string, qty: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tb_cart";

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

let cache: CartItem[] = load();
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): CartItem[] {
  return cache;
}

function persist(items: CartItem[]) {
  cache = items;
  if (typeof window !== "undefined") {
    if (items.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  listeners.forEach((l) => l());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const existing = cache.find((it) => it.slug === item.slug);
      const next = existing
        ? cache.map((it) =>
            it.slug === item.slug ? { ...it, qty: it.qty + qty } : it
          )
        : [...cache, { ...item, qty }];
      persist(next);
    },
    []
  );

  const updateQty = useCallback((slug: string, qty: number) => {
    persist(
      qty <= 0
        ? cache.filter((it) => it.slug !== slug)
        : cache.map((it) => (it.slug === slug ? { ...it, qty } : it))
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    persist(cache.filter((it) => it.slug !== slug));
  }, []);

  const clear = useCallback(() => persist([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, it) => sum + it.qty, 0);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    return { items, count, subtotal, addItem, updateQty, removeItem, clear };
  }, [items, addItem, updateQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
