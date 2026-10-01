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
  let body: {
    product_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Review request must contain valid JSON." }, { status: 400 });
  }

  if (
    typeof body.product_id !== "string" ||
    !body.product_id.trim() ||
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return NextResponse.json({ error: "A product_id and rating between 1 and 5 are required." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : "";
  if (!comment) {
    return NextResponse.json({ error: "Please add a comment about your experience." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to leave a review." }, { status: 401 });
    }

    const admin = createAdminClient();

    const ordersByUser = await admin
      .from("orders")
      .select("id, customer_name, status")
      .eq("user_id", user.id);
    if (ordersByUser.error) {
      console.error("REVIEW PURCHASE CHECK ERROR:", ordersByUser.error);
      return NextResponse.json({ error: "Unable to verify your purchase right now. Please try again." }, { status: 500 });
    }

    const ordersByEmail = user.email
      ? await admin
          .from("orders")
          .select("id, customer_name, status")
          .ilike("email", user.email)
      : { data: [], error: null };
    if (ordersByEmail.error) {
      console.error("REVIEW PURCHASE CHECK ERROR:", ordersByEmail.error);
      return NextResponse.json({ error: "Unable to verify your purchase right now. Please try again." }, { status: 500 });
    }

    const orders = [...(ordersByUser.data ?? []), ...(ordersByEmail.data ?? [])];
    const paidOrders = Array.from(
      new Map(
        orders
          .filter((order) => ["paid", "delivered"].includes(String(order.status).toLowerCase()))
          .map((order) => [order.id, order]),
      ).values(),
    );
    if (paidOrders.length === 0) {
      return NextResponse.json({ error: "Only customers with a paid or delivered order can review this product." }, { status: 403 });
    }

    const { data: purchasedItems, error: itemsError } = await admin
      .from("order_items")
      .select("order_id")
      .in("order_id", paidOrders.map((order) => order.id))
      .eq("product_id", body.product_id);
    if (itemsError) {
      console.error("REVIEW PURCHASE CHECK ERROR:", itemsError);
      return NextResponse.json({ error: "Unable to verify your purchase right now. Please try again." }, { status: 500 });
    }
    if (!purchasedItems?.length) {
      return NextResponse.json({ error: "You can review a product after it appears in one of your paid or delivered orders." }, { status: 403 });
    }

    const purchasedOrderIds = new Set(purchasedItems.map((item) => item.order_id));
    const matchingOrder = paidOrders.find((order) => purchasedOrderIds.has(order.id));
    const customerName = matchingOrder?.customer_name || user.email?.split("@")[0] || "Customer";

    const { data, error } = await admin
      .from("product_reviews")
      .upsert(
        {
          product_id: body.product_id,
          user_id: user.id,
          customer_name: customerName,
          customer_email: user.email,
          rating: body.rating,
          title: title || null,
          comment,
          verified_purchase: true,
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
  } catch (error) {
    console.error("REVIEW SUBMIT ERROR:", error);
    return NextResponse.json({ error: "Unable to submit your review right now. Please try again." }, { status: 500 });
  }
}
