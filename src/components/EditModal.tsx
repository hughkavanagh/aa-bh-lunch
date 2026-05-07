"use client";

import { useState } from "react";
import type { Review } from "@/types";

interface EditModalProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
  password: string;
  isAdmin: boolean;
}

export default function EditModal({
  review,
  onClose,
  onSuccess,
  password,
  isAdmin,
}: EditModalProps) {
  const [reviewerName, setReviewerName] = useState(review.reviewer_name);
  const [rating, setRating] = useState(String(Number(review.rating)));
  const [price, setPrice] = useState(String(Number(review.price)));
  const [whatTheyGot, setWhatTheyGot] = useState(review.what_they_got ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          review_id: review.id,
          reviewer_name: reviewerName.trim(),
          rating: parseFloat(rating),
          price: parseFloat(price),
          what_they_got: whatTheyGot.trim() || null,
          admin: isAdmin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
      } else {
        onSuccess();
      }
    } catch {
      setError("Connection error");
    }
    setSubmitting(false);
  };

  const isValid =
    reviewerName.trim() &&
    rating &&
    parseFloat(rating) >= 1 &&
    parseFloat(rating) <= 10 &&
    price &&
    parseFloat(price) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium uppercase tracking-widest">
            Edit review
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
              Your name
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Rating (1–10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-surface focus:outline-none focus:border-fg"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
                Price ($)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-surface focus:outline-none focus:border-fg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-muted font-medium mb-1 block">
              What you got
            </label>
            <input
              type="text"
              value={whatTheyGot}
              onChange={(e) => setWhatTheyGot(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-fg"
            />
          </div>

          {error && <p className="text-accent text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="mt-2 w-full py-2.5 text-sm bg-fg text-bg rounded-md hover:opacity-90 disabled:opacity-40 uppercase tracking-widest font-medium"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
