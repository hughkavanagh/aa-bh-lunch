"use client";

import type { PlaceWithStats, Review } from "@/types";
import { formatPrice } from "@/lib/utils";
import ReviewList from "./ReviewList";

interface PlaceRowProps {
  place: PlaceWithStats;
  expanded: boolean;
  onToggle: () => void;
  myReviewIds: string[];
  isAdmin: boolean;
  onEditReview: (review: Review) => void;
  onDeleteReview: (review: Review) => void;
}

export default function PlaceRow({
  place,
  expanded,
  onToggle,
  myReviewIds,
  isAdmin,
  onEditReview,
  onDeleteReview,
}: PlaceRowProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-border/20 transition-colors border-b border-border/60"
      >
        <td className="py-3 px-4">
          <a
            href={place.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:underline font-medium"
          >
            {place.name}
          </a>
        </td>
        <td className="py-3 px-4 font-mono text-right">
          {place.review_count > 0 ? place.avg_rating.toFixed(1) : "—"}
        </td>
        <td className="py-3 px-4 font-mono text-right">
          {place.review_count > 0 ? formatPrice(place.avg_price) : "—"}
        </td>
        <td className="py-3 px-4 font-mono text-right">
          {place.walk_minutes} min
        </td>
        <td className="py-3 px-4 font-mono text-right">
          {place.review_count > 0 ? place.rating_per_dollar.toFixed(1) : "—"}
        </td>
        <td className="py-3 px-4 text-right text-muted text-sm">
          {place.review_count}
        </td>
        <td className="py-3 px-2 text-muted">
          <span
            className={`inline-block transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-border/10">
            <ReviewList
              reviews={place.reviews}
              myReviewIds={myReviewIds}
              isAdmin={isAdmin}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
            />
          </td>
        </tr>
      )}
    </>
  );
}
