"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireProductAdmin() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile, error } = await authClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    throw new Error("Administrator access required.");
  }

  return createAdminClient();
}

export async function saveProduct(formData: FormData) {
  const admin = await requireProductAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const originalPriceValue = String(formData.get("originalPrice") || "").trim();
  const originalPrice = originalPriceValue ? Number(originalPriceValue) : null;

  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    throw new Error("Enter a valid product name, price, and stock quantity.");
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
    throw new Error("Enter a valid original price.");
  }

  const payload = {
    name,
    slug: slugify(name),
    description: String(formData.get("description") || ""),
    category: String(formData.get("category") || "Face Care"),
    price,
    originalPrice,
    stock,
    badge: String(formData.get("badge") || "").trim() || null,
    image: String(formData.get("image") || "").trim() || null,
    hidden: formData.get("hidden") !== "on",
  };

  const result = id
    ? await admin.from("products").update(payload).eq("id", id)
    : await admin.from("products").insert(payload);

  if (result.error) {
    throw result.error;
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/deals");
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const admin = await requireProductAdmin();
  const { error } = await admin
    .from("products")
    .delete()
    .eq("id", String(formData.get("id")));

  if (error) {
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/deals");
  revalidatePath("/admin/products");
}
