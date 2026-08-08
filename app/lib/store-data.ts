import type { AnalyticsEntry, AnalyticsPeriod, Order, Payment, Product, ProductCategory, StoreSettings } from "@/app/lib/types";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

export const categories: Array<{
  label: ProductCategory;
  description: string;
}> = [
  {
    label: "Face Care",
    description: "Cleansers, serums, moisturizers and essentials for healthy glowing skin.",
  },
  {
    label: "Body Care",
    description: "Lotions, body washes, oils and everyday body care essentials.",
  },
  {
    label: "Hair Care",
    description: "Shampoos, conditioners, treatments and nourishing formulas for every texture.",
  },
  {
    label: "Hair",
    description: "Quality wigs, extensions, braids and beautiful hair options for every style.",
  },
  {
    label: "Men's Grooming",
    description: "Beard care, shaving, skincare and everyday grooming essentials for men.",
  },
  {
    label: "Women's Perfume",
    description: "Elegant fragrances for women, from everyday scents to signature perfumes.",
  },
  {
    label: "Men's Perfume",
    description: "Fresh, bold and sophisticated fragrances for men.",
  },
  {
    label: "Baby Care",
    description: "Gentle skincare, bath and everyday care essentials made for babies.",
  },
];


export const validReferralCodes = [
  { code: "LUEUR10", discountPercent: 10, label: "10% welcome reward" },
  { code: "LUEUR15", discountPercent: 15, label: "15% VIP reward" },
  { code: "GLOWUP", discountPercent: 5, label: "5% glow reward" },
] as const;

export function getReferralCodeShareLink(code: string) {
  if (typeof window === "undefined") {
    return `/referrals?ref=${encodeURIComponent(code)}`;
  }

  return `${window.location.origin}/referrals?ref=${encodeURIComponent(code)}`;
}

export function normalizeReferralCode(code: string | undefined) {
  return (code ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function getReferralReward(code: string | undefined) {
  const normalized = normalizeReferralCode(code);
  return validReferralCodes.find((entry) => entry.code === normalized) ?? null;
}

export function getReferralSummary(orders: Order[]) {
  const counts = new Map<string, number>();

  orders.forEach((order) => {
    const normalized = normalizeReferralCode(order.referralCode);
    if (!normalized) {
      return;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([code, count]) => ({
    code,
    count,
    reward: getReferralReward(code),
  }));
}

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Velvet Dew Serum",
    slug: "velvet-dew-serum",
    category: "Face Care",
    price: 48,
    originalPrice: 64,
    description: "A featherlight serum with niacinamide and squalane to leave skin dewy and calm.",
    shortDescription: "Brightening serum for daily glow",
    benefits: ["Hydrates", "Brightens", "Calms irritation"],
    tag: "Best seller",
    stock: 24,
    image: "🧴",
    featured: true,
  },
  {
    id: "prod-2",
    name: "Cocoa Silk Body Butter",
    slug: "cocoa-silk-body-butter",
    category: "Body Care",
    price: 34,
    description: "A rich whipped body butter that melts into silky, lasting nourishment.",
    shortDescription: "Deep moisture for dry skin",
    benefits: ["Ultra-rich", "Long lasting", "Softens rough elbows"],
    tag: "New",
    stock: 18,
    image: "🫧",
    featured: true,
  },
  {
    id: "prod-3",
    name: "Moringa Repair Shampoo",
    slug: "moringa-repair-shampoo",
    category: "Hair Care",
    price: 29,
    description: "A pH-balanced shampoo that strengthens strands while supporting scalp comfort.",
    shortDescription: "Strengthening shampoo for healthy hair",
    benefits: ["Repairs", "Adds shine", "Gentle on scalp"],
    tag: "Gentle care",
    stock: 15,
    image: "💧",
    featured: false,
  },
  {
    id: "prod-4",
    name: "Noir Beard Elixir",
    slug: "noir-beard-elixir",
    category: "Men's Grooming",
    price: 22,
    description: "A clean beard oil that softens coarse stubble and gives a polished finish.",
    shortDescription: "Tames beard and softens skin",
    benefits: ["Softens stubble", "Adds shine", "Nourishes skin"],
    tag: "Top rated",
    stock: 11,
    image: "🪵",
    featured: true,
  },
];

export const initialSettings: StoreSettings = {
  storeName: "Lueur & Co",
  storeLogo: "/favicon.ico",
  whatsappNumber: "+260977000000",
  paymentNumbers: {
    "MTN Mobile Money": "+260770000001",
    "Airtel Money": "+260960000001",
    "Zamtel Money": "+260950000001",
    "Bank Transfer": "0101234567",
    "Cash on Delivery": "+260977000000",
  },
  bankDetails: {
    accountName: "Lueur & Co Zambia",
    accountNumber: "0101234567",
    bankName: "Zanaco",
    branch: "Lusaka",
    swiftCode: "ZANAZMLU",
  },
  supportEmail: "hello@lueurco.co.zm",
  supportPhone: "+260977000000",
  deliveryFee: 25,
  businessHours: "Mon-Sat: 8:00 AM - 8:00 PM",
  socialLinks: {
    instagram: "https://instagram.com/lueurco",
    facebook: "https://facebook.com/lueurco",
    tiktok: "https://tiktok.com/@lueurco",
  },
};

const STORAGE_KEYS = {
  products: "lueur-co-products",
  orders: "lueur-co-orders",
  payments: "lueur-co-payments",
  settings: "lueur-co-settings",
  analytics: "lueur-co-analytics",
};

function getDateKey(date: Date, period: AnalyticsPeriod) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (period === "day") {
    return `${year}-${month}-${day}`;
  }

  const start = new Date(date);
  const dayOfWeek = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayOfWeek);
  const weekStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (period === "week") {
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
  }

  return `${year}-${month}`;
}

export function getAnalyticsEntries(): AnalyticsEntry[] {
  return safeRead<AnalyticsEntry[]>(STORAGE_KEYS.analytics, []);
}

export function saveAnalyticsEntries(entries: AnalyticsEntry[]) {
  safeWrite(STORAGE_KEYS.analytics, entries);
}

export function computeAnalyticsSummary(entries: AnalyticsEntry[]) {
  const now = new Date();
  const dayKey = `day:${getDateKey(now, "day")}`;
  const weekKey = `week:${getDateKey(now, "week")}`;
  const monthKey = `month:${getDateKey(now, "month")}`;

  return {
    day: entries
      .filter((entry) => entry.period === "day" && entry.periodKey === dayKey)
      .reduce((sum, entry) => sum + entry.visitCount, 0),
    week: entries
      .filter((entry) => entry.period === "week" && entry.periodKey === weekKey)
      .reduce((sum, entry) => sum + entry.visitCount, 0),
    month: entries
      .filter((entry) => entry.period === "month" && entry.periodKey === monthKey)
      .reduce((sum, entry) => sum + entry.visitCount, 0),
  };
}

export function getAnalyticsSummary(): { day: number; week: number; month: number } {
  return computeAnalyticsSummary(getAnalyticsEntries());
}

export async function recordVisitAnalytics() {
  if (typeof window === "undefined") {
    return;
  }

  const sessionKey = "lueur-co-visit-logged";
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const nextEntries = [...getAnalyticsEntries()];

  const periods: Array<{ period: AnalyticsPeriod; periodKey: string }> = [
    { period: "day", periodKey: `day:${getDateKey(now, "day")}` },
    { period: "week", periodKey: `week:${getDateKey(now, "week")}` },
    { period: "month", periodKey: `month:${getDateKey(now, "month")}` },
  ];

  periods.forEach(({ period, periodKey }) => {
    const existing = nextEntries.find((entry) => entry.period === period && entry.periodKey === periodKey);
    if (existing) {
      existing.visitCount += 1;
      existing.updatedAt = nowIso;
      return;
    }

    nextEntries.push({
      id: `analytics-${period}-${periodKey}`,
      period,
      periodKey,
      visitCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  });

  saveAnalyticsEntries(nextEntries);
  sessionStorage.setItem(sessionKey, "true");

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return;
  }

  for (const entry of nextEntries) {
    const { error } = await supabase.from("analytics_visits").upsert(entry, { onConflict: "id" });
    if (error) {
      console.warn("Analytics sync failed:", error.message);
    }
  }
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getProducts(): Product[] {
  return safeRead<Product[]>(STORAGE_KEYS.products, initialProducts);
}

export function saveProducts(products: Product[]) {
  safeWrite(STORAGE_KEYS.products, products);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((product) => product.slug === slug);
}

export function getOrders(): Order[] {
  return safeRead<Order[]>(STORAGE_KEYS.orders, []);
}

export function saveOrders(orders: Order[]) {
  safeWrite(STORAGE_KEYS.orders, orders);
}

export function getPayments(): Payment[] {
  return safeRead<Payment[]>(STORAGE_KEYS.payments, []);
}

export function savePayments(payments: Payment[]) {
  safeWrite(STORAGE_KEYS.payments, payments);
}

export function getSettings(): StoreSettings {
  return safeRead<StoreSettings>(STORAGE_KEYS.settings, initialSettings);
}

export function saveSettings(settings: StoreSettings) {
  safeWrite(STORAGE_KEYS.settings, settings);
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
