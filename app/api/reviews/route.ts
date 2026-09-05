import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: boolean;
  created_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json({ error: "product_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_reviews")
    .select("id, product_id, user_id, customer_name, rating, title, comment, verified_purchase, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load reviews." }, { status: 500 });
  }

  const reviews = (data ?? []) as ReviewRow[];
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  return NextResponse.json({
    reviews,
    reviewCount,
    averageRating: Math.round(averageRating * 100) / 100,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      product_id?: string;
      rating?: number;
      title?: string;
      comment?: string;
    };

    if (!body.product_id || typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "A product_id and rating between 1 and 5 are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to leave a review." }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verified purchase check: has this customer ever ordered this product?
    const { data: orders } = await admin
      .from("orders")
      .select("items, email")
      .eq("email", user.email ?? "");

    const verifiedPurchase = (orders ?? []).some((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return items.some((item: { product?: { id?: string } }) => item?.product?.id === body.product_id);
    });

    const customerName =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Verified customer";

    const { data, error } = await admin
      .from("product_reviews")
      .upsert(
        {
          product_id: body.product_id,
          user_id: user.id,
          customer_name: customerName,
          customer_email: user.email,
          rating: Math.round(body.rating),
          title: body.title?.slice(0, 120) ?? null,
          comment: body.comment?.slice(0, 2000) ?? null,
          verified_purchase: verifiedPurchase,
          status: "approved",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id,user_id" }
      )
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Unable to save review." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }
}
