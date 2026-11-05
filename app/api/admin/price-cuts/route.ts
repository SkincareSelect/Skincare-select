import { NextResponse } from "next/server";
import { calculatePriceCut, roundMoney } from "@/app/lib/price-cut";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function authorizeAdmin() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error) {
    console.error("PRICE CUT ADMIN ACCESS ERROR:", error);
    return { error: NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 }) };
  }
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  return { admin };
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isProductId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200 && value.trim() === value;
}

export async function GET() {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  const [{ data: products, error: productsError }, { data: cuts, error: cutsError }] = await Promise.all([
    authorization.admin.from("products").select("id,name,price,category").order("name"),
    authorization.admin.from("price_cuts").select("*").order("created_at", { ascending: false }),
  ]);
  if (productsError || cutsError) {
    console.error("PRICE CUT LOAD ERROR:", productsError ?? cutsError);
    return NextResponse.json({ error: "Could not load price cuts. Apply the price-cuts database migration and try again." }, { status: 500 });
  }

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  return NextResponse.json({
    products: products ?? [],
    priceCuts: (cuts ?? []).map((cut) => ({ ...cut, product: productById.get(cut.product_id) ?? null })),
  });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Price cut data must be an object." }, { status: 400 });
  }
  const { product_id, original_price, discount_percentage, is_active } = body as {
    product_id?: unknown;
    original_price?: unknown;
    discount_percentage?: unknown;
    is_active?: unknown;
  };

  if (
    !isProductId(product_id) ||
    typeof original_price !== "number" ||
    !Number.isFinite(original_price) ||
    original_price < 0 ||
    original_price > 9999999999.99 ||
    typeof discount_percentage !== "number" ||
    !Number.isFinite(discount_percentage) ||
    discount_percentage < 0 ||
    discount_percentage > 100 ||
    typeof is_active !== "boolean"
  ) {
    return NextResponse.json({ error: "Choose a valid product and enter a non-negative original price and discount from 0 to 100%." }, { status: 400 });
  }

  const { data: product, error: productError } = await authorization.admin
    .from("products")
    .select("id")
    .eq("id", product_id)
    .maybeSingle();
  if (productError) {
    console.error("PRICE CUT PRODUCT LOOKUP ERROR:", productError);
    return NextResponse.json({ error: "Could not verify the selected product." }, { status: 500 });
  }
  if (!product) return NextResponse.json({ error: "The selected product does not exist." }, { status: 400 });

  const originalPrice = roundMoney(original_price);
  const discountPercentage = roundMoney(discount_percentage);
  const { discountAmount, salePrice } = calculatePriceCut(originalPrice, discountPercentage);
  const isActive = is_active && discountPercentage > 0;
  const { data, error } = await authorization.admin
    .from("price_cuts")
    .upsert({
      product_id,
      original_price: originalPrice,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      sale_price: salePrice,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }, { onConflict: "product_id" })
    .select("*")
    .single();
  if (error) {
    console.error("PRICE CUT SAVE ERROR:", error);
    return NextResponse.json({ error: "Could not save this price cut." }, { status: 500 });
  }

  return NextResponse.json({ priceCut: data });
}

export async function PATCH(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Price cut status data must be an object." }, { status: 400 });
  }
  const { id, is_active } = body as { id?: unknown; is_active?: unknown };
  if (!isUuid(id) || typeof is_active !== "boolean") {
    return NextResponse.json({ error: "A valid price cut and active status are required." }, { status: 400 });
  }

  const { data: cut, error: loadError } = await authorization.admin.from("price_cuts")
    .select("discount_percentage").eq("id", id).maybeSingle();
  if (loadError) {
    console.error("PRICE CUT LOAD ERROR:", loadError);
    return NextResponse.json({ error: "Could not load this price cut." }, { status: 500 });
  }
  if (!cut) return NextResponse.json({ error: "Price cut was not found." }, { status: 404 });
  const isActive = is_active && Number(cut.discount_percentage) > 0;

  const { data, error } = await authorization.admin.from("price_cuts")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id).select("*").single();
  if (error) {
    console.error("PRICE CUT STATUS ERROR:", error);
    return NextResponse.json({ error: "Could not update the price cut status." }, { status: 500 });
  }
  return NextResponse.json({ priceCut: data });
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdmin();
  if ("error" in authorization) return authorization.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request must contain valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Price cut data must be an object." }, { status: 400 });
  }
  const { id } = body as { id?: unknown };
  if (!isUuid(id)) return NextResponse.json({ error: "A valid price cut is required." }, { status: 400 });

  const { data, error } = await authorization.admin.from("price_cuts")
    .delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("PRICE CUT DELETE ERROR:", error);
    return NextResponse.json({ error: "Could not remove this price cut." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Price cut was not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
