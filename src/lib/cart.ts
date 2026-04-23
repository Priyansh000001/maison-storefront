import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
};

const STORAGE_KEY = "maison_cart_v1";

let items: CartItem[] = [];
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw);
  } catch {
    items = [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

let loaded = false;
function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    load();
    loaded = true;
  }
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): CartItem[] {
  ensureLoaded();
  return items;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

export function useCart() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = list.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = list.reduce((acc, i) => acc + i.price * i.quantity, 0);
  return { items: list, count, subtotal };
}

export function addToCart(item: CartItem) {
  ensureLoaded();
  const idx = items.findIndex(
    (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
  );
  if (idx >= 0) {
    items[idx].quantity += item.quantity;
  } else {
    items = [...items, item];
  }
  persist();
}

export function updateQuantity(productId: string, size: string, color: string, qty: number) {
  ensureLoaded();
  items = items
    .map((i) =>
      i.productId === productId && i.size === size && i.color === color
        ? { ...i, quantity: Math.max(0, qty) }
        : i
    )
    .filter((i) => i.quantity > 0);
  persist();
}

export function removeFromCart(productId: string, size: string, color: string) {
  ensureLoaded();
  items = items.filter(
    (i) => !(i.productId === productId && i.size === size && i.color === color)
  );
  persist();
}

export function clearCart() {
  items = [];
  persist();
}
