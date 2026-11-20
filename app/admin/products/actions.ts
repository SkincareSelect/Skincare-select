"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { categories } from "@/app/lib/store-data";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isShoeSizeSystem(value: string): value is "EU" | "US" | "UK" {
  return value === "EU" || value === "US" || value === "UK";
}

export type ProductSaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function requireProductAdmin() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    throw new Error("Administrator access required.");
  }

  return admin;
}

export async function saveProduct(
  previousState: ProductSaveState,
  formData: FormData,
): Promise<ProductSaveState> {
  void previousState;

  let admin: Awaited<ReturnType<typeof requireProductAdmin>>;
  try {
    admin = await requireProductAdmin();
  } catch (error) {
    if (error instanceof Error) {
      return { status: "error", message: error.message };
    }
    throw error;
  }

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const originalPriceValue = String(formData.get("originalPrice") || "").trim();
  const originalPrice = originalPriceValue ? Number(originalPriceValue) : null;
  const category = String(formData.get("category") || "");
  const sizeTypeValue = String(formData.get("sizeType") || "");
  const sizeSystemValue = String(formData.get("sizeSystem") || "");
  const availableSizesValue = String(formData.get("availableSizes") || "");

  if (
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    !categories.some((item) => item.label === category)
  ) {
    return { status: "error", message: "Enter a valid product name, category, price, and stock quantity." };
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
    return { status: "error", message: "Enter a valid original price." };
  }

  let sizeOptions: { type: "apparel" | "footwear"; system?: "EU" | "US" | "UK"; available: string[] } | null = null;
  if (sizeTypeValue) {
    if (sizeTypeValue !== "apparel" && sizeTypeValue !== "footwear") {
      return { status: "error", message: "Choose apparel or footwear for size options." };
    }
    const enteredSizes = availableSizesValue.split(",").map((size) => size.trim()).filter(Boolean);
    const available =
      sizeTypeValue === "apparel"
        ? [...new Set(enteredSizes.map((size) => size.toUpperCase()))]
        : [...new Set(enteredSizes)];
    if (available.length === 0 || available.length > 30 || available.some((size) => size.length > 12)) {
      return { status: "error", message: "Enter between 1 and 30 available sizes, separated by commas." };
    }
    if (
      sizeTypeValue === "apparel" &&
      available.some((size) => !["XS", "S", "M", "L", "XL", "XXL"].includes(size.toUpperCase()))
    ) {
      return { status: "error", message: "Apparel sizes must be XS, S, M, L, XL, or XXL." };
    }
    if (
      sizeTypeValue === "footwear" &&
      (!isShoeSizeSystem(sizeSystemValue) ||
        available.some((size) => !/^\d{1,3}(?:\.\d)?$/.test(size)))
    ) {
      return { status: "error", message: "Choose EU (Europe), UK, or US (USA) sizing and enter numeric shoe sizes." };
    }
    if (category !== "Apparel and footwear") {
      return { status: "error", message: "Size options are only available for Apparel and footwear products." };
    }
    sizeOptions = {
      type: sizeTypeValue,
      system: sizeTypeValue === "footwear" && isShoeSizeSystem(sizeSystemValue) ? sizeSystemValue : undefined,
      available,
    };
  } else if (availableSizesValue.trim()) {
    return { status: "error", message: "Choose an item type before entering available sizes." };
  }

  const description = String(formData.get("description") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const payload = {
    name,
    slug: slugify(name),
    description,
    shortDescription: description || name,
    category,
    size_options: sizeOptions,
    price,
    originalPrice,
    stock,
    badge: String(formData.get("badge") || "").trim(),
    benefits: [],
    image: image || "🧴",
    featured: false,
    hidden: formData.get("visible") !== "on",
  };

  const result = id
    ? await admin.from("products").update(payload).eq("id", id).select("id").maybeSingle()
    : await admin.from("products").insert(payload).select("id").single();

  if (result.error) {
    console.error("PRODUCT SAVE ERROR:", result.error);
    return { status: "error", message: `Could not save product: ${result.error.message}` };
  }
  if (!result.data) {
    return { status: "error", message: "Product was not found and could not be updated." };
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/deals");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return { status: "success", message: id ? "Product updated." : "Product saved." };
}

export async function deleteProduct(formData: FormData) {
  const admin = await requireProductAdmin();
  const { data, error } = await admin
    .from("products")
    .delete()
    .eq("id", String(formData.get("id")))
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Product was not found and could not be deleted.");
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/deals");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}
