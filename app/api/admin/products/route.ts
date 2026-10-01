import { NextResponse } from "next/server";
import type { Product } from "@/app/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function authorizeAdmin() {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("PRODUCT ADMIN ACCESS ERROR:", error);
    return { error: NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 }) };
  }

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }

  return { admin };
}

function toDatabaseProduct(product: Product) {
  return {
    id: product.id,
    name: product.name.trim(),
    slug: product.slug.trim(),
    category: product.category,
    brand: product.brand ?? null,
    price: product.price,
    original_price: product.originalPrice ?? null,
    description: product.description,
    short_description: product.shortDescription,
    benefits: product.benefits,
    tag: product.badge ?? "",
    stock: product.stock,
    image: product.image,
    images: product.images ?? [],
    featured: product.featured,
    hidden: product.hidden ?? false,
    product_type: product.productType ?? null,
    discount: product.discount ?? null,
  };
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    const body = (await request.json()) as { product?: Product };
    const product = body.product;
    if (
      !product ||
      typeof product.id !== "string" ||
      !product.id.trim() ||
      typeof product.name !== "string" ||
      !product.name.trim() ||
      typeof product.slug !== "string" ||
      !product.slug.trim() ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0
    ) {
      return NextResponse.json({ error: "Product details are invalid." }, { status: 400 });
    }

    const { data, error } = await authorization.admin
      .from("products")
      .upsert(toDatabaseProduct(product), { onConflict: "id" })
      .select("id")
      .single();
    if (error) {
      console.error("PRODUCT SAVE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("PRODUCT SAVE ERROR:", error);
    return NextResponse.json({ error: "Product could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  try {
    const body = (await request.json()) as { id?: string };
    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const { data, error } = await authorization.admin
      .from("products")
      .delete()
      .eq("id", body.id)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("PRODUCT DELETE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Product was not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);
    return NextResponse.json({ error: "Product could not be deleted." }, { status: 500 });
  }
}
