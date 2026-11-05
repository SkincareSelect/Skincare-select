'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/app/lib/types";
import { getProductPrice } from "@/app/lib/price-cut";
import { fetchProductsFromSupabase } from "@/app/lib/supabase/data-client";

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      await Promise.resolve();
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
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
                item.product.stock > 0 &&
                (!item.product.sizeOptions ||
                  (typeof item.selectedSize === "string" &&
                    item.product.sizeOptions.available.includes(item.selectedSize) &&
                    (item.product.sizeOptions.type !== "footwear" ||
                      item.sizeSystem === item.product.sizeOptions.system))),
            ).map((item) => ({
              ...item,
              quantity: Math.min(item.quantity, item.product.stock),
            }));
            if (!cancelled) setItems(validItems);
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      if (!cancelled) setHydrated(true);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }

    if (items.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [hydrated, items]);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let cancelled = false;
    void fetchProductsFromSupabase()
      .then((result) => {
        if (result.error) {
          console.error("CART PRICE REFRESH ERROR:", result.error);
          return;
        }
        if (cancelled) return;
        const productsById = new Map(result.products.map((product) => [product.id, product]));
        setItems((currentItems) => currentItems.map((item) => ({
          ...item,
          product: productsById.get(item.product.id) ?? item.product,
        })));
      })
      .catch((error: unknown) => {
        console.error("CART PRICE REFRESH ERROR:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, items.length]);

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
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0), [items]);

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
