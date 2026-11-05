"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Check, Pencil, Plus, Search, Sparkles, Tag, Trash2, X } from "lucide-react";
import { calculatePriceCut, roundMoney } from "@/app/lib/price-cut";

type PriceCutProduct = { id: string; name: string; price: number; category: string };
type PriceCut = {
  id: string;
  product_id: string;
  original_price: number;
  discount_percentage: number;
  discount_amount: number;
  sale_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product: PriceCutProduct | null;
};

function formatPrice(value: number) {
  return `K${Number(value).toFixed(2)}`;
}

export function PriceCutsDashboard() {
  const [products, setProducts] = useState<PriceCutProduct[]>([]);
  const [priceCuts, setPriceCuts] = useState<PriceCut[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [sort, setSort] = useState<"newest" | "discount">("newest");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [active, setActive] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/price-cuts", { cache: "no-store" });
      const result = await response.json() as { products?: PriceCutProduct[]; priceCuts?: PriceCut[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Price cuts could not be loaded.");
      setProducts(result.products ?? []);
      setPriceCuts(result.priceCuts ?? []);
      setFeedback("");
    } catch (error) {
      console.error("PRICE CUT LOAD ERROR:", error);
      setFeedback(error instanceof Error ? error.message : "Price cuts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/price-cuts", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { products?: PriceCutProduct[]; priceCuts?: PriceCut[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Price cuts could not be loaded.");
        if (!cancelled) {
          setProducts(result.products ?? []);
          setPriceCuts(result.priceCuts ?? []);
        }
      })
      .catch((error: unknown) => {
        console.error("PRICE CUT LOAD ERROR:", error);
        if (!cancelled) setFeedback(error instanceof Error ? error.message : "Price cuts could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = products.find((product) => product.id === productId);
  const parsedOriginalPrice = Number(originalPrice);
  const parsedPercentage = Number(discountPercentage);
  const calculated = originalPrice !== "" && discountPercentage !== "" &&
    Number.isFinite(parsedOriginalPrice) && parsedOriginalPrice >= 0 &&
    Number.isFinite(parsedPercentage) && parsedPercentage >= 0 && parsedPercentage <= 100
    ? calculatePriceCut(roundMoney(parsedOriginalPrice), parsedPercentage)
    : null;

  const filteredCuts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return priceCuts
      .filter((cut) => statusFilter === "All" || (statusFilter === "Active") === cut.is_active)
      .filter((cut) => !query || cut.product?.name.toLowerCase().includes(query))
      .sort((first, second) => sort === "discount"
        ? Number(second.discount_percentage) - Number(first.discount_percentage)
        : new Date(second.created_at).getTime() - new Date(first.created_at).getTime());
  }, [priceCuts, search, sort, statusFilter]);
  const activeCount = priceCuts.filter((cut) => cut.is_active).length;
  const inactiveCount = priceCuts.length - activeCount;
  const activeSavings = priceCuts
    .filter((cut) => cut.is_active)
    .reduce((sum, cut) => sum + Number(cut.discount_amount), 0);

  const resetForm = () => {
    setEditingId(null);
    setProductId("");
    setOriginalPrice("");
    setDiscountPercentage("");
    setActive(true);
  };

  const selectProduct = (nextId: string) => {
    setProductId(nextId);
    if (!editingId) {
      const product = products.find((entry) => entry.id === nextId);
      setOriginalPrice(product ? String(Number(product.price).toFixed(2)) : "");
    }
  };

  const editCut = (cut: PriceCut) => {
    setEditingId(cut.id);
    setProductId(cut.product_id);
    setOriginalPrice(String(Number(cut.original_price).toFixed(2)));
    setDiscountPercentage(String(cut.discount_percentage));
    setActive(cut.is_active);
    setFeedback("");
    document.getElementById("price-cut-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveCut = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productId || !calculated) {
      setFeedback("Select a product and enter a valid price and discount percentage.");
      return;
    }

    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/price-cuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          original_price: roundMoney(parsedOriginalPrice),
          discount_percentage: parsedPercentage,
          is_active: active,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Price cut could not be saved.");
      resetForm();
      await loadData();
      setFeedback("Price cut saved.");
    } catch (error) {
      console.error("PRICE CUT SAVE ERROR:", error);
      setFeedback(error instanceof Error ? error.message : "Price cut could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const updatePercentage = (value: string) => {
    setDiscountPercentage(value);
    if (value !== "" && Number(value) === 0) setActive(false);
  };

  const toggleActive = async (cut: PriceCut) => {
    try {
      const response = await fetch("/api/admin/price-cuts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cut.id, is_active: !cut.is_active }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Price cut status could not be changed.");
      await loadData();
      setFeedback(cut.is_active ? "Price cut deactivated." : "Price cut activated.");
    } catch (error) {
      console.error("PRICE CUT STATUS ERROR:", error);
      setFeedback(error instanceof Error ? error.message : "Price cut status could not be changed.");
    }
  };

  const deleteCut = async (cut: PriceCut) => {
    if (!window.confirm(`Permanently remove the price cut for ${cut.product?.name ?? "this product"}?`)) return;
    try {
      const response = await fetch("/api/admin/price-cuts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cut.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Price cut could not be removed.");
      await loadData();
      if (editingId === cut.id) resetForm();
      setFeedback("Price cut removed.");
    } catch (error) {
      console.error("PRICE CUT DELETE ERROR:", error);
      setFeedback(error instanceof Error ? error.message : "Price cut could not be removed.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="overflow-hidden rounded-3xl bg-[#2f241f] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8c7a9]"><Tag size={15} /> Catalogue pricing</p>
            <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Price Cuts</h1>
            <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">Create and manage product discounts. Your saved product prices stay untouched.</p>
          </div>
          <a
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2f241f] transition hover:bg-[#f7f2eb]"
            href="#price-cut-form"
            onClick={resetForm}
          >
            <Plus size={17} /> Create price cut
          </a>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Price cut overview">
        <div className="flex items-center gap-4 rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7f2eb] text-[#8d6e63]"><Tag size={20} /></span>
          <div><p className="text-sm text-slate-500">All price cuts</p><p className="text-2xl font-semibold text-slate-900">{priceCuts.length}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check size={20} /></span>
          <div><p className="text-sm text-slate-500">Active now</p><p className="text-2xl font-semibold text-slate-900">{activeCount}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Sparkles size={20} /></span>
          <div><p className="text-sm text-slate-500">Active savings per item</p><p className="text-2xl font-semibold text-slate-900">{formatPrice(activeSavings)}</p></div>
        </div>
      </section>

      <section id="price-cut-form" className="scroll-mt-6 overflow-hidden rounded-3xl border border-[#eadfce] bg-white shadow-sm">
        <div className="border-b border-[#f0e6dd] px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d6e63]">{editingId ? "Update promotion" : "New promotion"}</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#2f241f]">{editingId ? "Edit price cut" : "Create a price cut"}</h2>
              <p className="mt-1 text-sm text-slate-500">Choose a product and discount; we’ll calculate the sale price.</p>
            </div>
            {editingId ? <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={resetForm} aria-label="Cancel editing"><X size={19} /></button> : null}
          </div>
        </div>
        <form className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.8fr)]" onSubmit={saveCut}>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
              Product
              <select className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#8d6e63] focus:ring-2 focus:ring-[#8d6e63]/15" required disabled={Boolean(editingId)} value={productId} onChange={(event) => selectProduct(event.target.value)}>
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={!editingId && priceCuts.some((cut) => cut.product_id === product.id)}>
                    {product.name} · {formatPrice(Number(product.price))}
                    {!editingId && priceCuts.some((cut) => cut.product_id === product.id) ? " · Has price cut" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Original price (K)
              <input className="w-full min-w-0 rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-[#8d6e63] focus:ring-2 focus:ring-[#8d6e63]/15" required type="number" min="0" max="9999999999.99" step="0.01" value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} />
              {selectedProduct ? <span className="block text-xs font-normal text-slate-500">Product base price: {formatPrice(Number(selectedProduct.price))}. This won’t be changed.</span> : null}
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Discount (%)
              <span className="relative block">
                <input className="w-full min-w-0 rounded-xl border border-slate-200 px-3.5 py-3 pr-10 text-sm outline-none transition focus:border-[#8d6e63] focus:ring-2 focus:ring-[#8d6e63]/15" required type="number" min="0" max="100" step="0.01" value={discountPercentage} onChange={(event) => updatePercentage(event.target.value)} placeholder="e.g. 20" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">%</span>
              </span>
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-medium text-slate-700 sm:col-span-2">
              <input className="h-4 w-4 accent-[#2f241f]" type="checkbox" disabled={discountPercentage !== "" && Number(discountPercentage) === 0} checked={active} onChange={(event) => setActive(event.target.checked)} />
              <span className="flex-1">Make this price cut active</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Active" : "Inactive"}</span>
            </label>
            {discountPercentage !== "" && Number(discountPercentage) === 0 ? (
              <p className="text-sm text-amber-800 sm:col-span-2">A 0% discount is saved inactive and does not change the storefront price.</p>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-1 sm:col-span-2">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f241f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48372f] disabled:cursor-not-allowed disabled:opacity-60" disabled={saving}>
                <Plus size={17} />{saving ? "Saving..." : editingId ? "Save changes" : "Create price cut"}
              </button>
              {editingId ? <button type="button" className="min-h-11 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={resetForm}>Cancel</button> : null}
            </div>
          </div>

          <aside className="flex flex-col justify-between rounded-2xl bg-[#f8f4ef] p-5 sm:p-6" aria-live="polite">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d6e63]"><BadgePercent size={16} /> Customer price preview</p>
              <p className="mt-5 text-sm text-slate-500">{selectedProduct?.name ?? "Select a product to preview its offer"}</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <p className="font-serif text-3xl font-semibold text-[#2f241f]">{calculated ? formatPrice(calculated.salePrice) : "K—"}</p>
                {calculated && originalPrice ? <p className="text-base text-slate-400 line-through">{formatPrice(parsedOriginalPrice)}</p> : null}
                {calculated && parsedPercentage > 0 ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">{parsedPercentage}% OFF</span> : null}
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                <Sparkles size={15} /> Save {calculated ? formatPrice(calculated.discountAmount) : "K—"}
              </p>
            </div>
            <p className="mt-6 border-t border-[#e8ddd1] pt-4 text-xs leading-5 text-slate-500">The price is calculated automatically and the product’s saved base price is preserved.</p>
          </aside>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white shadow-sm">
        <div className="border-b border-[#f0e6dd] px-5 py-5 sm:px-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#2f241f]">Your price cuts</h2>
              <p className="mt-1 text-sm text-slate-500">{loading ? "Loading offers..." : `${filteredCuts.length} of ${priceCuts.length} offer${priceCuts.length === 1 ? "" : "s"}`}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(200px,1fr)_150px_190px]">
              <label className="relative">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#8d6e63]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search price cuts by product" />
              </label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter price cuts by status">
                <option value="All">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort price cuts">
                <option value="newest">Sort: Newest</option><option value="discount">Sort: Discount %</option>
              </select>
            </div>
          </div>
          {!loading && priceCuts.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{priceCuts.length} total</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{activeCount} active</span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">{inactiveCount} inactive</span>
            </div>
          ) : null}
        </div>

        {feedback ? <p role="status" className="mx-5 mt-4 rounded-xl border border-[#eadfce] bg-[#fbf7f2] px-4 py-3 text-sm text-slate-700 sm:mx-7">{feedback}</p> : null}
        {loading ? (
          <div className="space-y-3 p-5 sm:p-7" role="status">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : filteredCuts.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#fbf8f5] text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr><th className="px-6 py-3.5 font-semibold">Product</th><th className="px-4 py-3.5 font-semibold">Old price</th><th className="px-4 py-3.5 font-semibold">Discount</th><th className="px-4 py-3.5 font-semibold">Sale price</th><th className="px-4 py-3.5 font-semibold">Savings</th><th className="px-4 py-3.5 font-semibold">Status</th><th className="px-6 py-3.5 text-right font-semibold">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCuts.map((cut) => (
                    <tr key={cut.id} className="transition hover:bg-[#fdfbf9]">
                      <td className="px-6 py-4"><p className="font-semibold text-slate-800">{cut.product?.name ?? "Deleted product"}</p><p className="mt-0.5 text-xs text-slate-400">{cut.product?.category ?? "Product"}</p></td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatPrice(Number(cut.original_price))}</td>
                      <td className="px-4 py-4"><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">{Number(cut.discount_percentage)}% OFF</span></td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#2f241f]">{formatPrice(Number(cut.sale_price))}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-emerald-700">Save {formatPrice(Number(cut.discount_amount))}</td>
                      <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cut.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${cut.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />{cut.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-2">
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => editCut(cut)}><Pencil size={14} /> Edit</button>
                        <button className={`rounded-lg px-3 py-2 text-xs font-semibold ${cut.is_active ? "border border-amber-200 text-amber-800 hover:bg-amber-50" : "border border-emerald-200 text-emerald-800 hover:bg-emerald-50"} disabled:cursor-not-allowed disabled:opacity-50`} disabled={Number(cut.discount_percentage) === 0} onClick={() => void toggleActive(cut)}>{Number(cut.discount_percentage) === 0 ? "0% inactive" : cut.is_active ? "Deactivate" : "Activate"}</button>
                        <button className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50" aria-label={`Remove discount for ${cut.product?.name ?? "product"}`} onClick={() => void deleteCut(cut)}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {filteredCuts.map((cut) => (
                <article key={cut.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="font-semibold text-slate-900">{cut.product?.name ?? "Deleted product"}</h3><p className="mt-1 text-xs text-slate-500">{cut.product?.category ?? "Product"}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cut.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{cut.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#fbf8f5] p-3 text-sm">
                    <div><p className="text-xs text-slate-500">Old price</p><p className="mt-1 text-slate-600 line-through">{formatPrice(Number(cut.original_price))}</p></div>
                    <div><p className="text-xs text-slate-500">Discount</p><p className="mt-1 font-semibold text-rose-700">{Number(cut.discount_percentage)}% OFF</p></div>
                    <div><p className="text-xs text-slate-500">Sale price</p><p className="mt-1 font-semibold text-[#2f241f]">{formatPrice(Number(cut.sale_price))}</p></div>
                    <div><p className="text-xs text-slate-500">Customer saves</p><p className="mt-1 font-medium text-emerald-700">{formatPrice(Number(cut.discount_amount))}</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => editCut(cut)}><Pencil size={14} /> Edit</button>
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50" disabled={Number(cut.discount_percentage) === 0} onClick={() => void toggleActive(cut)}>{Number(cut.discount_percentage) === 0 ? "0% inactive" : cut.is_active ? "Deactivate" : "Activate"}</button>
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => void deleteCut(cut)}><Trash2 size={14} /> Remove</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center sm:py-16">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7f2eb] text-[#8d6e63]"><Tag size={25} /></span>
            <h3 className="mt-4 font-serif text-xl font-semibold text-[#2f241f]">{priceCuts.length ? "No matching price cuts" : "No price cuts yet"}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{priceCuts.length ? "Try a different search or change the status filter." : "Create your first offer to show customers a clear sale price and savings on the storefront."}</p>
            {!priceCuts.length ? <a href="#price-cut-form" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2f241f] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Create first price cut</a> : null}
          </div>
        )}
      </section>
    </div>
  );
}
