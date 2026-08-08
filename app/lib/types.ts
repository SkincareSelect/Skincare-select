export type ProductCategory = "Face Care" | "Body Care" | "Hair Care" | "Men's Grooming" | "Makeup" | "Fragrances" | "Accessories";

export type OrderStatus =
  | "Pending Payment"
  | "Paid"
  | "Confirmed"
  | "Processing"
  | "Ready for Dispatch"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod =
  | "MTN Mobile Money"
  | "Airtel Money"
  | "Zamtel Money"
  | "Bank Transfer"
  | "Cash on Delivery";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  description: string;
  shortDescription: string;
  benefits: string[];
  tag: string;
  stock: number;
  image: string;
  images?: string[];
  featured: boolean;
  hidden?: boolean;
  brand?: string;
  skinType?: string;
  hairType?: string;
  productType?: string;
  discount?: number;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  referralCode?: string;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Refunded";

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  reference: string;
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
  storeName: string;
  storeLogo: string;
  whatsappNumber: string;
  paymentNumbers: Record<PaymentMethod, string>;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    swiftCode: string;
  };
  supportEmail: string;
  supportPhone: string;
  deliveryFee: number;
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
