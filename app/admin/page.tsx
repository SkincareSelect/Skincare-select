"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";
import { getAnalyticsSummary, getOrders, getPayments, getProducts, getReferralSummary, getSettings, saveOrders, savePayments, saveProducts, saveSettings } from "@/app/lib/store-data";
import { uploadProductImage } from "@/app/lib/supabase/client";
import { deleteProductFromSupabase, fetchOrdersFromSupabase, fetchPaymentsFromSupabase, fetchProductsFromSupabase, fetchSettingsFromSupabase, upsertOrderToSupabase, upsertProductToSupabase, upsertSettingsToSupabase } from "@/app/lib/supabase/data-client";
import type { Order, Payment, OrderStatus, PaymentStatus, Product, StoreSettings } from "@/app/lib/types";

const statusOptions: OrderStatus[] = ["Payment Pending", "Payment Confirmed", "Processing", "Ready for Delivery", "Ready for Dispatch", "Dispatched", "Delivered", "Cancelled"];

const statusStyles: Record<OrderStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  "Payment Pending": "bg-amber-100 text-amber-700 border-amber-200",
  "Payment Confirmed": "bg-sky-100 text-sky-700 border-sky-200",
  Processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Ready for Delivery": "bg-violet-100 text-violet-700 border-violet-200",
  "Ready for Dispatch": "bg-cyan-100 text-cyan-700 border-cyan-200",
  Dispatched: "bg-orange-100 text-orange-700 border-orange-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  Refunded: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatOrderDate = (value?: string) => {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const orderStatusCounts = (list: Order[]) => {
  const counts: Record<OrderStatus, number> = {
    Pending: 0,
    "Payment Pending": 0,
    "Payment Confirmed": 0,
    Processing: 0,
    "Ready for Delivery": 0,
    "Ready for Dispatch": 0,
    Dispatched: 0,
    Delivered: 0,
    Cancelled: 0,
    Refunded: 0,
  };

  list.forEach((order) => {
    counts[order.status] += 1;
  });

  return counts;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [orders, setOrders] = useState<Order[]>(getOrders);
  const [payments, setPayments] = useState<Payment[]>(getPayments);
  const [settings, setSettings] = useState<StoreSettings>(getSettings());
  const [draftProduct, setDraftProduct] = useState<Partial<Product>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [orderFilter, setOrderFilter] = useState<"All" | OrderStatus>("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderRange, setOrderRange] = useState<"All" | "Today" | "7 days" | "30 days">("All");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, router, user]);

  const referralSummary = useMemo(() => getReferralSummary(orders), [orders]);
  const analyticsSummary = useMemo(() => getAnalyticsSummary(), []);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = map.get(item.product.id) ?? { name: item.product.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += (item.product.price ?? 0) * item.quantity;
        map.set(item.product.id, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const revenueTrend = useMemo(() => {
    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        label: date.toLocaleDateString([], { month: "short", day: "numeric" }),
        value: 0,
      };
    });

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dateKey = date.toDateString();
      const target = lastSevenDays.find((day) => new Date(day.label).toDateString() === dateKey);
      if (!target) {
        return;
      }

      target.value += Number(order.total) || 0;
    });

    const maxValue = Math.max(...lastSevenDays.map((day) => day.value), 1);
    return lastSevenDays.map((day) => ({ ...day, percent: (day.value / maxValue) * 100 }));
  }, [orders]);

  const orderOverview = useMemo(() => {
    const summary = {
      openOrders: 0,
      delivered: 0,
      pendingPayments: 0,
      totalRevenue: 0,
    };

    orders.forEach((order) => {
      summary.totalRevenue += Number(order.total) || 0;
      if (order.status === "Delivered") {
        summary.delivered += 1;
      }
      if (order.status !== "Delivered" && order.status !== "Cancelled") {
        summary.openOrders += 1;
      }
      if (order.status === "Payment Pending") {
        summary.pendingPayments += 1;
      }
    });

    return summary;
  }, [orders]);

  const pendingDispatchOrders = useMemo(() =>
    orders.filter((order) => ["Payment Confirmed", "Processing", "Ready for Delivery", "Ready for Dispatch", "Dispatched"].includes(order.status)),
    [orders],
  );

  const salesReport = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = {
      today: 0,
      week: 0,
      month: 0,
      averageOrder: 0,
    };

    if (orders.length > 0) {
      summary.averageOrder = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0) / orders.length;
    }

    orders.forEach((order) => {
      const createdAt = new Date(order.createdAt);
      const value = Number(order.total) || 0;

      if (createdAt >= startOfToday) {
        summary.today += value;
      }
      if (createdAt >= startOfWeek) {
        summary.week += value;
      }
      if (createdAt >= startOfMonth) {
        summary.month += value;
      }
    });

    return summary;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      const dayDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      const matchesRange =
        orderRange === "All" ||
        (orderRange === "Today" && dayDiff >= 0 && dayDiff < 1) ||
        (orderRange === "7 days" && dayDiff >= 0 && dayDiff <= 7) ||
        (orderRange === "30 days" && dayDiff >= 0 && dayDiff <= 30);

      const matchesStatus = orderFilter === "All" || order.status === orderFilter;
      const matchesSearch = !query || [
        order.id,
        order.customerName,
        order.customerEmail,
        order.paymentMethod,
        order.shippingAddress,
      ].some((value) => value.toLowerCase().includes(query));

      return matchesRange && matchesStatus && matchesSearch;
    });
  }, [orderFilter, orderRange, orderSearch, orders]);

  useEffect(() => {
    void (async () => {
      const [remoteProducts, remoteOrders, remotePayments, remoteSettings] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchOrdersFromSupabase(),
        fetchPaymentsFromSupabase(),
        fetchSettingsFromSupabase(),
      ]);

      if (remoteProducts.length > 0) {
        setProducts(remoteProducts);
        saveProducts(remoteProducts);
      }
      if (remoteOrders.length > 0) {
        setOrders(remoteOrders);
        saveOrders(remoteOrders);
      }
      if (remotePayments.length > 0) {
        setPayments(remotePayments);
        savePayments(remotePayments);
      }
      if (remoteSettings) {
        setSettings(remoteSettings);
        saveSettings(remoteSettings);
      }
    })();
  }, []);

  const canManage = useMemo(() => user?.role === "admin", [user]);

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">Loading dashboard...</div>;
  }

  if (!canManage) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
        Access denied. Sign in with the admin account to manage the store.
      </div>
    );
  }

  const saveProduct = () => {
    const payload: Product = {
      id: editingId ?? `prod-${Date.now()}`,
      name: draftProduct.name ?? "Untitled product",
      slug: draftProduct.slug ?? (draftProduct.name ?? "untitled").toLowerCase().replace(/\s+/g, "-"),
      category: draftProduct.category ?? "Face Care",
      price: draftProduct.price ?? 0,
      description: draftProduct.description ?? "",
      shortDescription: draftProduct.shortDescription ?? "",
      benefits: draftProduct.benefits ?? [],
      badge: draftProduct.badge ?? "NEW",
      stock: draftProduct.stock ?? 0,
      image: draftProduct.image ?? "🧴",
      featured: draftProduct.featured ?? false,
    };

    const nextProducts = editingId ? products.map((product) => (product.id === editingId ? payload : product)) : [payload, ...products];
    setProducts(nextProducts);
    saveProducts(nextProducts);
    void upsertProductToSupabase(payload);
    setDraftProduct({});
    setEditingId(null);
  };

  const deleteProduct = (id: string) => {
    const nextProducts = products.filter((product) => product.id !== id);
    setProducts(nextProducts);
    saveProducts(nextProducts);
    void deleteProductFromSupabase(id);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const nextOrders = orders.map((order) => (order.id === id ? { ...order, status } : order));
    setOrders(nextOrders);
    saveOrders(nextOrders);
    void upsertOrderToSupabase(nextOrders.find((order) => order.id === id) as Order);
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus) => {
    const nextPayments = payments.map((payment) =>
      payment.id === id ? { ...payment, status, updatedAt: new Date().toISOString() } : payment,
    );
    setPayments(nextPayments);
    savePayments(nextPayments);
    void fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: id, status }),
    });
  };

  const updateOrderNotes = (id: string, notes: string) => {
    const nextOrders = orders.map((order) => (order.id === id ? { ...order, notes } : order));
    setOrders(nextOrders);
    saveOrders(nextOrders);
    void upsertOrderToSupabase(nextOrders.find((order) => order.id === id) as Order);
  };

  const saveStoreSettings = async () => {
    saveSettings(settings);
    const result = await upsertSettingsToSupabase(settings);
    if (result.error) {
      setFeedback("Store settings saved locally, but Supabase update failed.");
      return;
    }
    setFeedback("Store settings saved.");
  };

  const exportFilteredOrders = () => {
    if (!filteredOrders.length) {
      setFeedback("There are no orders to export for the current filter.");
      return;
    }

    const headers = ["Order ID", "Customer Name", "Email", "Status", "Payment Method", "Total", "Items", "Shipping Address", "Referral Code", "Created At"];
    const rows = filteredOrders.map((order) => {
      const itemSummary = order.items.map((item) => `${item.product.name} x${item.quantity}`).join(" | ");
      const values = [
        order.id,
        order.customerName,
        order.customerEmail,
        order.status,
        order.paymentMethod,
        String(order.total),
        itemSummary,
        order.shippingAddress,
        order.referralCode ?? "",
        formatOrderDate(order.createdAt),
      ];

      return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lueur-orders-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback(`Exported ${filteredOrders.length} filtered order(s) as CSV.`);
  };

  const printOrderSummary = () => {
    const content = filteredOrders.length ? filteredOrders.map((order) => `
      <div style="margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
        <h3 style="margin: 0 0 8px;">Order ${order.id}</h3>
        <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> K${order.total}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod}</p>
        <p><strong>Delivery:</strong> ${order.shippingAddress}</p>
        <p><strong>Items:</strong> ${order.items.map((item) => `${item.product.name} x${item.quantity}`).join(", ") || "No items"}</p>
        <p><strong>Notes:</strong> ${order.notes || "None"}</p>
      </div>
    `).join("") : "<p>No orders match the current criteria.</p>";

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setFeedback("Your browser blocked the print window. Please allow pop-ups and try again.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Zhurie & Co order summary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 20px; }
            p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <h1>Zhurie & Co Order Summary</h1>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setFeedback(`Prepared a print summary for ${filteredOrders.length} order(s).`);
  };

  const openWhatsAppForOrder = (order: Order) => {
    const rawNumber = settings.whatsappNumber?.replace(/\D/g, "") ?? "";
    if (!rawNumber) {
      setFeedback("Set a WhatsApp number in store settings before contacting a customer.");
      return;
    }

    const message = encodeURIComponent(
      `Hi ${order.customerName}, this is Zhurie & Co. We are following up on your order ${order.id}. Current status: ${order.status}. Thank you!`,
    );

    window.open(`https://wa.me/${rawNumber}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    const publicUrl = await uploadProductImage(file);
    setUploadingImage(false);

    if (publicUrl) {
      setDraftProduct((current) => ({ ...current, image: publicUrl }));
      setFeedback("Image uploaded to Supabase storage.");
    } else {
      setFeedback("Image upload is unavailable without Supabase storage configuration.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">Admin dashboard</p>
            <p className="mt-3 text-lg font-medium text-slate-700">Welcome, Mr Kondowe</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage products, orders, and payments</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-violet-600">View storefront</Link>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">Marketing analytics</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Today</p>
                <p className="mt-1 text-xl font-bold text-violet-700">{analyticsSummary.day}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">This week</p>
                <p className="mt-1 text-xl font-bold text-violet-700">{analyticsSummary.week}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">This month</p>
                <p className="mt-1 text-xl font-bold text-violet-700">{analyticsSummary.month}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">Referral tracking</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {referralSummary.length > 0 ? referralSummary.map((entry) => (
                <div key={entry.code} className="rounded-2xl bg-white p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{entry.code}</p>
                  <p className="mt-1">{entry.reward?.label ?? "Referral code"}</p>
                  <p className="mt-1">Uses: {entry.count}</p>
                </div>
              )) : <p className="text-sm text-slate-600">No referral codes used yet.</p>}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Products</h2>
            <button onClick={() => { setEditingId(null); setDraftProduct({}); }} className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white">
              New product
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <input placeholder="Name" value={draftProduct.name ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input placeholder="Slug" value={draftProduct.slug ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, slug: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input placeholder="Price" type="number" value={draftProduct.price ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, price: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input placeholder="Stock" type="number" value={draftProduct.stock ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, stock: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <select value={draftProduct.category ?? "Face Care"} onChange={(event) => setDraftProduct((current) => ({ ...current, category: event.target.value as Product["category"] }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
                {["Face Care", "Body Care", "Hair Care", "Men's Grooming", "Makeup", "Fragrances", "Accessories", "Baby Care"].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input placeholder="Badge" value={draftProduct.badge ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, badge: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input placeholder="Image emoji" value={draftProduct.image ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, image: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <label className="block text-sm font-medium text-slate-700">Upload product image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-sm" />
              {uploadingImage ? <p className="text-sm text-slate-500">Uploading image...</p> : null}
              <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={draftProduct.featured ?? false} onChange={(event) => setDraftProduct((current) => ({ ...current, featured: event.target.checked }))} />Featured product</label>
            </div>
            <div className="space-y-3">
              <textarea placeholder="Short description" value={draftProduct.shortDescription ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, shortDescription: event.target.value }))} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <textarea placeholder="Description" value={draftProduct.description ?? ""} onChange={(event) => setDraftProduct((current) => ({ ...current, description: event.target.value }))} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <textarea placeholder="Benefits (comma separated)" value={(draftProduct.benefits ?? []).join(", ")} onChange={(event) => setDraftProduct((current) => ({ ...current, benefits: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <button onClick={saveProduct} className="w-full rounded-full bg-violet-600 px-4 py-3 font-semibold text-white">
                {editingId ? "Update product" : "Add product"}
              </button>
              {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.category} • K{product.price}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(product.id); setDraftProduct(product); }} className="rounded-full border border-slate-200 px-3 py-2 text-sm">Edit</button>
                  <button onClick={() => deleteProduct(product.id)} className="rounded-full bg-rose-600 px-3 py-2 text-sm text-white">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Orders</h2>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">{orders.length} total</span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {statusOptions.slice(0, 4).map((status) => (
                <div key={status} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{status}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{orderStatusCounts(orders)[status]}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Open orders</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{orderOverview.openOrders}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Revenue</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">K{orderOverview.totalRevenue}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Delivered</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{orderOverview.delivered}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pending pays</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{orderOverview.pendingPayments}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600">Filtered orders: {filteredOrders.length}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={printOrderSummary}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Print summary
                </button>
                <button
                  type="button"
                  onClick={exportFilteredOrders}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top products</p>
                <div className="mt-3 space-y-3">
                  {topProducts.map((product) => (
                    <div key={product.name} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{product.name}</p>
                        <p className="text-slate-500">{product.quantity} sold</p>
                      </div>
                      <span className="font-semibold text-violet-700">K{product.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Revenue trend</p>
                <div className="mt-4 flex h-32 items-end gap-2">
                  {revenueTrend.map((day) => (
                    <div key={day.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div className="w-full rounded-t-xl bg-violet-500" style={{ height: `${day.percent}%` }} title={`${day.label}: K${day.value}`} />
                      <span className="text-[10px] text-slate-500">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sales report</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Today</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">K{salesReport.today}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">7 days</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">K{salesReport.week}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Month</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">K{salesReport.month}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Avg order</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">K{salesReport.averageOrder.toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending dispatch</p>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{pendingDispatchOrders.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {pendingDispatchOrders.length > 0 ? pendingDispatchOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{order.customerName}</p>
                      <p className="text-slate-500">{order.status}</p>
                    </div>
                    <span className="font-semibold text-slate-700">K{order.total}</span>
                  </div>
                )) : <p className="text-sm text-slate-500">No orders waiting for dispatch.</p>}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search by customer, email, order ID or address"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-violet-400"
              />

              <div className="flex flex-wrap gap-2">
                {(["All", "Today", "7 days", "30 days"] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setOrderRange(range)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${orderRange === range ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOrderFilter("All")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${orderFilter === "All" ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                >
                  All
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderFilter(status)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${orderFilter === status ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No orders match your current search or filter.
                </div>
              ) : filteredOrders.map((order) => {
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const orderedItems = order.items.map((item) => `${item.product.name} x${item.quantity}`).join(" • ");

                return (
                  <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order #{order.id.slice(-6)}</p>
                        <p className="mt-2 font-semibold text-slate-900">{order.customerName}</p>
                        <p className="text-sm text-slate-500">{order.customerEmail}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p><span className="font-medium text-slate-700">Date:</span> {formatOrderDate(order.createdAt)}</p>
                      <p><span className="font-medium text-slate-700">Items:</span> {itemCount}</p>
                      <p><span className="font-medium text-slate-700">Payment:</span> {order.paymentMethod}</p>
                      <p><span className="font-medium text-slate-700">Total:</span> K{order.total}</p>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-700">Order details</p>
                      <p className="mt-1">{orderedItems || "No items listed"}</p>
                    </div>

                    {order.shippingAddress ? (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Delivery:</span> {order.shippingAddress}
                      </p>
                    ) : null}

                    {order.referralCode ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Referral:</span> {order.referralCode}
                      </p>
                    ) : null}

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Delivery timeline</p>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((status) => {
                          const currentIndex = statusOptions.indexOf(order.status);
                          const statusIndex = statusOptions.indexOf(status);
                          const isActive = statusIndex === currentIndex;
                          const isPassed = statusIndex < currentIndex;

                          return (
                            <span
                              key={status}
                              className={`rounded-full border px-2 py-1 text-[10px] font-medium ${isActive ? "border-violet-600 bg-violet-600 text-white" : isPassed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
                            >
                              {status}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openWhatsAppForOrder(order)}
                        className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        WhatsApp customer
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fulfillment notes</label>
                      <textarea
                        value={order.notes ?? ""}
                        onChange={(event) => updateOrderNotes(order.id, event.target.value)}
                        placeholder="Add packing, shipping or customer follow-up notes."
                        className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
                      />
                    </div>

                    <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)} className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Payments</h2>
            <div className="mt-6 space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{payment.paymentMethod}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{payment.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Order: {payment.orderId}</p>
                  <p className="mt-2 text-sm text-slate-500">Reference: {payment.reference || "Not available"}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Created: {new Date(payment.createdAt).toLocaleString()}</p>
                  <select value={payment.status} onChange={(event) => updatePaymentStatus(payment.id, event.target.value as PaymentStatus)} className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    {["pending", "processing", "paid", "failed", "cancelled", "awaiting_bank_verification", "refunded"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">SWIFT code</label>
            <input value={settings.bankDetails.swiftCode} onChange={(event) => setSettings((current) => ({ ...current, bankDetails: { ...current.bankDetails, swiftCode: event.target.value } }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
          </div>
        </div>
      </section>
      <button onClick={saveStoreSettings} className="mt-6 rounded-full bg-slate-900 px-4 py-3 font-semibold text-white">
        Save settings
      </button>
      {feedback ? <p className="mt-4 text-sm text-slate-600">{feedback}</p> : null}
    </div>
  );
}
