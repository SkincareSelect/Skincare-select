"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: boolean;
  created_at: string;
};

function Stars({ value, size = "text-lg" }: { value: number; size?: string }) {
  return (
    <span className={`${size} leading-none text-[#d9a441]`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((position) => (
        <span key={position}>{position <= Math.round(value) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`);
      const data = await response.json();
      setReviews(data.reviews ?? []);
      setAverageRating(data.averageRating ?? 0);
      setReviewCount(data.reviewCount ?? 0);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setAverageRating(data.averageRating ?? 0);
        setReviewCount(data.reviewCount ?? 0);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const submitReview = async () => {
    if (rating < 1) {
      setFeedback({ ok: false, message: "Please select a star rating." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, title, comment }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFeedback({ ok: false, message: data.error ?? "Unable to submit review." });
        return;
      }

      setFeedback({ ok: true, message: "Thank you! Your review has been posted." });
      setRating(0);
      setTitle("");
      setComment("");
      void loadReviews();
    } catch {
      setFeedback({ ok: false, message: "Unable to submit review." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Reviews</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Customer reviews</h2>
        </div>
        {reviewCount > 0 ? (
          <div className="flex items-center gap-3">
            <Stars value={averageRating} size="text-2xl" />
            <div>
              <p className="text-lg font-semibold text-slate-900">{averageRating.toFixed(1)} / 5</p>
              <p className="text-sm text-slate-500">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-[1.5rem] bg-[#fbf7f2] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={review.rating} />
                <p className="font-semibold text-slate-900">{review.customer_name}</p>
                {review.verified_purchase ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Verified purchase
                  </span>
                ) : null}
                <span className="text-xs text-slate-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.title ? <p className="mt-2 font-medium text-slate-800">{review.title}</p> : null}
              {review.comment ? <p className="mt-1 text-sm text-slate-600">{review.comment}</p> : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-8 border-t border-[#eadfce] pt-6">
        {user ? (
          <div className="space-y-4">
            <p className="font-semibold text-slate-900">Write a review</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setRating(position)}
                  className="text-2xl leading-none text-[#d9a441] transition hover:scale-110"
                  aria-label={`Rate ${position} star${position > 1 ? "s" : ""}`}
                >
                  {position <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Review title (optional)"
              className="w-full rounded-full border border-[#eadfce] px-4 py-2 text-sm focus:border-[#d8c1b1] focus:outline-none"
              maxLength={120}
            />
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full rounded-[1.25rem] border border-[#eadfce] px-4 py-3 text-sm focus:border-[#d8c1b1] focus:outline-none"
              rows={3}
              maxLength={2000}
            />
            {feedback ? (
              <p className={`text-sm ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>{feedback.message}</p>
            ) : null}
            <button
              onClick={submitReview}
              disabled={submitting}
              className="rounded-full bg-[#d9b8a7] px-6 py-3 text-sm font-semibold text-[#2f241f] transition hover:bg-[#c99d89] disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            <a href="/login" className="font-semibold text-[#8d6e63]">
              Sign in
            </a>{" "}
            to write a review.
          </p>
        )}
      </div>
    </section>
  );
}
