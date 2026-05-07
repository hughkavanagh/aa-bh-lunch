"use client";

import type { Review } from "@/types";
import ReviewItem from "./ReviewItem";

interface ReviewListProps {
  reviews: Review[];
  myReviewIds: string[];
  isAdmin: boolean;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
}

export default function ReviewList({
  reviews,
  myReviewIds,
  isAdmin,
  onEdit,
  onDelete,
}: ReviewListProps) {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="pl-4 pr-2 pb-4">
      {sorted.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          canEdit={isAdmin || myReviewIds.includes(review.id)}
          onEdit={() => onEdit(review)}
          onDelete={() => onDelete(review)}
        />
      ))}
    </div>
  );
}
