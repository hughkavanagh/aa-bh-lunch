"use client";

import type { PlaceWithStats, Review } from "@/types";
import { formatPrice } from "@/lib/utils";
import ReviewList from "./ReviewList";

interface PlaceCardProps {
  place: PlaceWithStats;
  expanded: boolean;
  onToggle: () => void;
  myReviewIds: string[];
  isAdmin: boolean;
  onEditReview: (review: Review) => void;
  onDeleteReview: (review: Review) => void;
}

export default function PlaceCard({
  place,
  expanded,
  onToggle,
  myReviewIds,
  isAdmin,
  onEditReview,
  onDeleteReview,
}: PlaceCardProps) {
  return (
    <div className="border border-border/60 rounded-lg bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-border/10 transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <a
            href={place.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium hover:underline text-base"
          >
            {place.name}
          </a>
          <span
            className={`text-muted transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="font-mono">
            {place.review_count > 0 ? place.avg_rating.toFixed(1) : "—"}
            <span className="text-muted ml-1 font-sans text-xs">rating</span>
          </span>
          <span className="font-mono">
            {place.review_count > 0 ? formatPrice(place.avg_price) : "—"}
            <span className="text-muted ml-1 font-sans text-xs">avg</span>
          </span>
          <span className="font-mono">
            {place.walk_minutes} min
            <span className="text-muted ml-1 font-sans text-xs">walk</span>
          </span>
          <span className="font-mono">
            {place.review_count > 0 ? place.rating_per_dollar.toFixed(1) : "—"}
            <span className="text-muted ml-1 font-sans text-xs">rating/$</span>
          </span>
          <span className="text-muted text-xs self-center">
            {place.review_count} review{place.review_count !== 1 ? "s" : ""}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/60">
          <ReviewList
            reviews={place.reviews}
            myReviewIds={myReviewIds}
            isAdmin={isAdmin}
            onEdit={onEditReview}
            onDelete={onDeleteReview}
          />
        </div>
      )}
    </div>
  );
}
