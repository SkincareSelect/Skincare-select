'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/app/lib/types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, selectedSize?: string, sizeSystem?: "EU" | "US" | "UK") => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, sizeSystem?: "EU" | "US" | "UK") => void;
  removeItem: (productId: string, selectedSize?: string, sizeSystem?: "EU" | "US" | "UK") => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "skincare-select-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as CartItem[];
      if (Array.isArray(parsed)) {
        const validItems = parsed.filter(
          (item) =>
            item &&
            item.product &&
            typeof item.product.id === "string" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.product.stock > 0,
        ).map((item) => ({
          ...item,
          quantity: Math.min(item.quantity, item.product.stock),
        }));
        window.setTimeout(() => setItems(validItems), 0);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (items.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [items]);

  const addItem = useCallback((product: Product, selectedSize?: string, sizeSystem?: "EU" | "US" | "UK") => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) =>
        item.product.id === product.id &&
        item.selectedSize === selectedSize &&
        item.sizeSystem === sizeSystem,
      );
      if (existing) {
        return currentItems.map((item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.sizeSystem === sizeSystem
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }

      return product.stock > 0 ? [...currentItems, { product, quantity: 1, selectedSize, sizeSystem }] : currentItems;
    });
  }, []);

  const removeItem = useCallback((productId: string, selectedSize?: string, sizeSystem?: "EU" | "US" | "UK") => {
    setItems((currentItems) => currentItems.filter((item) => !(
      item.product.id === productId &&
      (selectedSize === undefined || (item.selectedSize === selectedSize && item.sizeSystem === sizeSystem))
    )));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string, sizeSystem?: "EU" | "US" | "UK") => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, sizeSystem);
      return;
    }

    setItems((currentItems) => currentItems.map((item) => (
     item.product.id === productId &&
     (selectedSize === undefined || (item.selectedSize === selectedSize && item.sizeSystem === sizeSystem))
       ? { ...item, quantity: Math.min(quantity, item.product.stock) }
       : item
    )));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => items.reduce((count, item) => count + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart }),
    [items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
