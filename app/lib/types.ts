export type ProductCategory =
  | "Face Care"
  | "Body Care"
  | "Hair Care"
  | "Men's Grooming"
  | "Makeup"
  | "Fragrances"
  | "Accessories"
  | "Baby Care";

export type OrderStatus =
  | "Pending"
  | "Payment Pending"
  | "Payment Confirmed"
  | "Processing"
  | "Ready for Delivery"
  | "Ready for Dispatch"
  | "Dispatched"
  | "Delivered"
  | "Cancelled"
  | "Refunded";

export type PaymentMethod =
  | "MTN Mobile Money"
  | "Airtel Money"
  | "Zamtel Money"
  | "Bank Transfer"
  | "Cash on Delivery";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "cancelled" | "awaiting_bank_verification" | "refunded";

export type StockStatus = "IN STOCK" | "LOW STOCK" | "OUT OF STOCK";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  subcategory?: string;
  brand?: string;
  sku?: string;
  productType?: string;
  gender?: string;
  ageGroup?: string;
  description: string;
  shortDescription: string;
  benefits: string[];
  ingredients?: string[];
  instructions?: string;
  size?: string;
  weight?: string;
  suitableFor?: string[];
  tags?: string[];
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  stockStatus?: StockStatus;
  image: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  featured: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  hidden?: boolean;
  badge?: string;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  shippingAddress: string;
  area?: string;
  city?: string;
  referralCode?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  reference: string;
  providerTransactionId?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsPeriod = "day" | "week" | "month";

export interface AnalyticsEntry {
  id: string;
  period: AnalyticsPeriod;
  periodKey: string;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  storeLogo: string;
  storeEmail: string;
  phoneNumber: string;
  whatsappNumber: string;
  mtnNumber: string;
  airtelNumber: string;
  zamtelNumber: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  supportEmail?: string;
  supportPhone?: string;
  paymentNumbers: Record<PaymentMethod, string>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    swiftCode: string;
  };
  deliveryFee: number;
  currency?: string;
  businessHours: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
}
