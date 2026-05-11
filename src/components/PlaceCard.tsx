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
  onAddReview: () => void;
  onDeletePlace: () => void;
  onMovePlace: () => void;
  onRenamePlace: () => void;
  unreviewed?: boolean;
  highlighted?: boolean;
}

export default function PlaceCard({
  place,
  expanded,
  onToggle,
  myReviewIds,
  isAdmin,
  onEditReview,
  onDeleteReview,
  onAddReview,
  onDeletePlace,
  onMovePlace,
  onRenamePlace,
  unreviewed,
  highlighted,
}: PlaceCardProps) {
  const canExpand = !unreviewed || isAdmin;
  return (
    <div
      data-place-id={place.id}
      className={`border border-border/60 rounded-lg bg-surface overflow-hidden ${
        highlighted ? "ring-2 ring-border animate-pulse" : ""
      }`}
    >
      <div className="w-full text-left p-4">
        <div className="flex items-start justify-between mb-2">
          <a
            href={place.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline text-base"
          >
            {place.name}
          </a>
          <div className="flex items-center gap-4">
            <button
              onClick={onAddReview}
              className="text-xs text-muted hover:text-fg border border-border/60 rounded px-2 py-1 hover:border-fg/30 transition-colors whitespace-nowrap"
            >
              + Review
            </button>
            {canExpand && (
              <button onClick={onToggle} className="p-2 -mr-2">
                <span
                  className={`text-muted transition-transform inline-block ${
                    expanded ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {unreviewed ? (
            <>
              <span className="font-mono">
                {place.walk_minutes} min
                <span className="text-muted ml-1 font-sans text-xs">walk</span>
              </span>
              <span className="text-muted/40 text-xs self-center uppercase tracking-wider">
                Unreviewed
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border/60">
          {!unreviewed && (
            <ReviewList
              reviews={place.reviews}
              myReviewIds={myReviewIds}
              isAdmin={isAdmin}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
            />
          )}
          {isAdmin && (
            <div className="flex items-center gap-3 px-4 py-3 border-t border-border/40">
              <span className="text-xs text-muted uppercase tracking-widest mr-auto">
                Admin
              </span>
              <button
                onClick={onRenamePlace}
                className="text-xs text-muted hover:text-fg border border-border/60 rounded px-2 py-1 hover:border-fg/30 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={onMovePlace}
                className="text-xs text-muted hover:text-fg border border-border/60 rounded px-2 py-1 hover:border-fg/30 transition-colors"
              >
                Move to {place.category === "lunch" ? "Cafe" : "Lunch"}
              </button>
              <button
                onClick={onDeletePlace}
                className="text-xs text-accent hover:text-accent/80 border border-accent/30 rounded px-2 py-1 hover:border-accent/60 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
