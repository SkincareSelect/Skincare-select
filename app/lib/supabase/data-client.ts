import type { OrderStatus, Payment, Product, ProductCatalogueResult, Order, StoreSettings } from "@/app/lib/types";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";
import { mapSupabaseProduct } from "@/app/lib/supabase/product-mapper";
import { mapSupabaseSettings } from "@/app/lib/supabase/settings-mapper";
import { applyPriceCuts, type PriceCutRecord } from "@/app/lib/price-cut";

export async function fetchProductsFromSupabase(): Promise<ProductCatalogueResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    console.error("PRODUCT LOAD ERROR: Supabase browser configuration is missing.");
    return { products: [], error: "The product catalogue is temporarily unavailable. Please try again later." };
  }

  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("PRODUCT LOAD ERROR:", error);
    return { products: [], error: "The product catalogue is temporarily unavailable. Please try again later." };
  }

  if (!data) {
    console.error("PRODUCT LOAD ERROR: Supabase returned no product data.");
    return { products: [], error: "The product catalogue is temporarily unavailable. Please try again later." };
  }

  const { data: priceCuts, error: priceCutsError } = await supabase
    .from("price_cuts")
    .select("product_id,original_price,discount_percentage,discount_amount,sale_price,is_active")
    .eq("is_active", true);
  if (priceCutsError) {
    console.error("PRICE CUT LOAD ERROR:", priceCutsError);
    return { products: [], error: "Product prices are temporarily unavailable. Please try again later." };
  }

  return {
    products: applyPriceCuts(
      data.map((row) => mapSupabaseProduct(row)),
      (priceCuts ?? []) as PriceCutRecord[],
    ),
    error: null,
  };
}

export async function fetchOrdersFromSupabase() {
  type OrderRow = {
    id: string;
    order_number: string;
    customer_name: string;
    email: string | null;
    phone: string | null;
    subtotal: number;
    delivery_fee: number;
    total: number;
    status: string;
    payment_method: string;
    payment_reference: string | null;
    address: string;
    city: string | null;
    province: string | null;
    referral_code: string | null;
    notes: string | null;
    created_at: string;
    order_items: Array<{
      product_id: string | null;
      product_name: string;
      quantity: number;
      price?: number;
      unit_price?: number;
      selected_size?: string | null;
      size_system?: "EU" | "US" | "UK" | null;
    }> | null;
  };
  const response = await fetch("/api/admin/orders", { cache: "no-store" });
  const result = await response.json() as { orders?: OrderRow[]; message?: string };
  if (!response.ok) {
    throw new Error(result.message ?? "Orders could not be loaded.");
  }
  if (!Array.isArray(result.orders)) {
    throw new Error("The order service returned an invalid response.");
  }

  const statusMap: Record<string, OrderStatus> = {
    "Pending payment": "Payment Pending",
    Paid: "Payment Confirmed",
    "Address confirmed": "Address confirmed",
    "Ready for dispatch": "Ready for Dispatch",
    Pending: "Pending",
    "Payment Pending": "Payment Pending",
    "Payment Confirmed": "Payment Confirmed",
    Processing: "Processing",
    "Ready for Delivery": "Ready for Delivery",
    "Ready for Dispatch": "Ready for Dispatch",
    Dispatched: "Dispatched",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
    Refunded: "Refunded",
  };

  return result.orders.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.email ?? "",
    customerPhone: row.phone ?? undefined,
    items: Array.isArray(row.order_items)
      ? row.order_items.map((item: {
          product_id: string | null;
          product_name: string;
          quantity: number;
          price?: number;
          unit_price?: number;
          selected_size?: string | null;
          size_system?: "EU" | "US" | "UK" | null;
        }) => ({
          product: {
            id: String(item.product_id ?? ""),
            name: item.product_name,
            slug: "",
            category: "Accessories" as const,
            description: "",
            shortDescription: item.product_name,
            benefits: [],
            price: Number(item.price ?? item.unit_price) || 0,
            stock: Number(item.quantity) || 0,
            image: "🛍️",
            featured: false,
          },
          quantity: Number(item.quantity) || 0,
          selectedSize: item.selected_size ?? undefined,
          sizeSystem: item.size_system ?? undefined,
        }))
      : [],
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    discount: 0,
    total: Number(row.total) || 0,
    status: statusMap[row.status],
    paymentMethod: row.payment_method,
    paymentStatus: "pending",
    paymentReference: row.payment_reference ?? undefined,
    shippingAddress: [row.address, row.city, row.province].filter(Boolean).join(", "),
    city: row.city ?? undefined,
    referralCode: row.referral_code ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  })).map((order) => {
    if (!order.status) {
      throw new Error("An order has an unsupported status.");
    }
    return order;
  }) as Order[];
}

export async function fetchPaymentsFromSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return [] as Payment[];
  }

  const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
  if (error || !data) {
    return [] as Payment[];
  }

  return data.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    paymentMethod: row.payment_method,
    reference: row.reference ?? "",
    providerTransactionId: row.provider_transaction_id ?? undefined,
    amount: Number(row.amount) || 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as Payment[];
}

export async function upsertPaymentToSupabase(payment: Payment) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("payments").upsert(payment, { onConflict: "id" });
  return !error;
}

export async function fetchSettingsFromSupabase() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSupabaseSettings(data);
}

export async function upsertProductToSupabase(product: Product) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? `Product save failed (${response.status}).`);
  }
  return true;
}

export async function deleteProductFromSupabase(id: string) {
  const response = await fetch("/api/admin/products", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(result?.error ?? `Product delete failed (${response.status}).`);
  }
  return true;
}

export async function upsertOrderToSupabase(order: Order) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("orders").upsert(order, { onConflict: "id" });
  return !error;
}

export async function upsertSettingsToSupabase(settings: StoreSettings) {
  const response = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: new Error(result?.error ?? `Settings save failed (${response.status}).`) };
  }

  return { error: null };
}
