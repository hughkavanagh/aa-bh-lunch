"use client";

import type { Review } from "@/types";
import { formatPrice, timeAgo } from "@/lib/utils";

interface ReviewItemProps {
  review: Review;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ReviewItem({
  review,
  canEdit,
  onEdit,
  onDelete,
}: ReviewItemProps) {
  return (
    <div className="flex items-start justify-between py-3 border-t border-border/60">
      <div className="flex gap-3">
        {review.image_url && (
          <div className="w-12 h-12 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={review.image_url}
              alt="Food photo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{review.reviewer_name}</span>
            <span className="font-mono text-sm">{Number(review.rating).toFixed(1)}/10</span>
            <span className="font-mono text-sm text-muted">
              {formatPrice(Number(review.price))}
            </span>
          </div>
          {review.what_they_got && (
            <span className="text-sm italic text-muted">
              {review.what_they_got}
            </span>
          )}
          <span className="text-xs text-muted">{timeAgo(review.created_at)}</span>
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-muted hover:text-fg underline"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-muted hover:text-accent underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
