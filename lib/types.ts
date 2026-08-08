export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "Face" | "Body" | "Men" | "Hair";
  price: number;
  compare_at_price: number | null;
  stock: number;
  badge: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type CartItem = Product & { quantity: number };

export type StoreSettings = {
  id?: string;
  whatsapp: string;
  mtn_number: string;
  airtel_number: string;
  zamtel_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  province: string;
  city: string;
  address: string;
  landmark: string | null;
  delivery_method: string;
  delivery_fee: number;
  payment_method: string;
  payment_reference: string | null;
  subtotal: number;
  total: number;
  status: string;
  tracking_number: string | null;
  courier_name: string | null;
  notes: string | null;
  created_at: string;
};
