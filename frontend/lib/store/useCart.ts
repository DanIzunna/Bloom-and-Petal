"use client";

import { create } from "zustand";
import type { Product } from "../api";

export type CartItem = Product & { quantity: number };
type CartScope = "anonymous" | `customer:${string}` | `admin:${string}`;
type StoredCart = {
  items: CartItem[];
  deliveryDate: string;
  expiresAt?: number;
};
type CartState = {
  items: CartItem[];
  deliveryDate: string;
  scope: CartScope;
  hydrated: boolean;
  initialize: () => void;
  switchScope: (scope: CartScope, mergeAnonymous?: boolean) => void;
  clearScope: (scope: CartScope) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setDeliveryDate: (date: string) => void;
  clearCart: () => void;
};

const anonymousLifetime = 7 * 24 * 60 * 60 * 1000;
const keyFor = (scope: CartScope) => `bloom-petal-cart:${scope}`;

function readCart(scope: CartScope): StoredCart {
  if (typeof window === "undefined") return { items: [], deliveryDate: "" };
  try {
    const raw = window.localStorage.getItem(keyFor(scope));
    if (!raw) return { items: [], deliveryDate: "" };
    const stored = JSON.parse(raw) as StoredCart;
    if (
      scope === "anonymous" &&
      stored.expiresAt &&
      stored.expiresAt < Date.now()
    ) {
      window.localStorage.removeItem(keyFor(scope));
      return { items: [], deliveryDate: "" };
    }
    return {
      items: Array.isArray(stored.items) ? stored.items : [],
      deliveryDate: stored.deliveryDate || "",
    };
  } catch {
    return { items: [], deliveryDate: "" };
  }
}
function writeCart(scope: CartScope, items: CartItem[], deliveryDate: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    keyFor(scope),
    JSON.stringify({
      items,
      deliveryDate,
      ...(scope === "anonymous"
        ? { expiresAt: Date.now() + anonymousLifetime }
        : {}),
    }),
  );
}
function mergeItems(existing: CartItem[], incoming: CartItem[]) {
  const merged = existing.map((item) => ({ ...item }));
  for (const item of incoming) {
    const match = merged.find((current) => current.id === item.id);
    if (match)
      match.quantity = Math.min(match.quantity + item.quantity, match.stock);
    else
      merged.push({ ...item, quantity: Math.min(item.quantity, item.stock) });
  }
  return merged.filter((item) => item.stock > 0 && item.quantity > 0);
}

export const useCart = create<CartState>((set, get) => {
  const persistState = (next: Partial<CartState>) => {
    set(next);
    const state = { ...get(), ...next };
    writeCart(state.scope, state.items, state.deliveryDate);
  };
  return {
    items: [],
    deliveryDate: "",
    scope: "anonymous",
    hydrated: false,
    initialize: () => {
      const stored = readCart("anonymous");
      set({ ...stored, scope: "anonymous", hydrated: true });
    },
    switchScope: (scope, mergeAnonymous = false) => {
      const target = readCart(scope);
      const anonymous = mergeAnonymous
        ? readCart("anonymous")
        : { items: [], deliveryDate: "" };
      const items = mergeAnonymous
        ? mergeItems(target.items, anonymous.items)
        : target.items;
      if (mergeAnonymous && typeof window !== "undefined")
        window.localStorage.removeItem(keyFor("anonymous"));
      set({
        scope,
        items,
        deliveryDate: target.deliveryDate || anonymous.deliveryDate,
        hydrated: true,
      });
      writeCart(scope, items, target.deliveryDate || anonymous.deliveryDate);
    },
    clearScope: (scope) => {
      if (typeof window !== "undefined")
        window.localStorage.removeItem(keyFor(scope));
      if (get().scope === scope) set({ items: [], deliveryDate: "" });
    },
    addToCart: (product) => {
      const existing = get().items.find((item) => item.id === product.id);
      const items = existing
        ? get().items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
              : item,
          )
        : [...get().items, { ...product, quantity: 1 }];
      persistState({ items });
    },
    removeFromCart: (id) =>
      persistState({ items: get().items.filter((item) => item.id !== id) }),
    updateQuantity: (id, quantity) =>
      persistState({
        items:
          quantity > 0
            ? get()
                .items.map((item) =>
                  item.id === id
                    ? { ...item, quantity: Math.min(quantity, item.stock) }
                    : item,
                )
                .filter((item) => item.quantity > 0)
            : get().items.filter((item) => item.id !== id),
      }),
    setDeliveryDate: (deliveryDate) => persistState({ deliveryDate }),
    clearCart: () => persistState({ items: [], deliveryDate: "" }),
  };
});
