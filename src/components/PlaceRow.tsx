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
  onAddReview: () => void;
  onDeletePlace: () => void;
  onMovePlace: (target: string) => void;
  onRenamePlace: () => void;
  unreviewed?: boolean;
  highlighted?: boolean;
}

export default function PlaceRow({
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
}: PlaceRowProps) {
  const canExpand = !unreviewed || isAdmin;
  return (
    <>
      <tr
        data-place-id={place.id}
        onClick={canExpand ? onToggle : undefined}
        className={`${canExpand ? "cursor-pointer" : ""} hover:bg-border/20 transition-colors border-b border-border/60 ${
          highlighted ? "bg-border/30 animate-pulse" : ""
        }`}
      >
        <td className="py-3 px-5">
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
        <td className="py-3 px-5 font-mono">
          {unreviewed ? (
            <span className="text-muted/40 text-xs tracking-wider">UNREVIEWED</span>
          ) : (
            place.review_count > 0 ? place.avg_rating.toFixed(1) : "—"
          )}
        </td>
        <td className="py-3 px-5 font-mono">
          {unreviewed ? (
            <span className="text-muted/40 text-xs tracking-wider">UNREVIEWED</span>
          ) : (
            place.review_count > 0 ? formatPrice(place.avg_price) : "—"
          )}
        </td>
        <td className="py-3 px-5 font-mono whitespace-nowrap">
          {place.walk_minutes} min
        </td>
        <td className="py-3 px-5 font-mono">
          {unreviewed ? (
            <span className="text-muted/40 text-xs tracking-wider">UNREVIEWED</span>
          ) : (
            place.review_count > 0 ? place.rating_per_dollar.toFixed(1) : "—"
          )}
        </td>
        <td className="py-3 pl-5 pr-1 text-muted text-sm">
          {place.review_count}
        </td>
        <td className="py-3 pl-1 pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddReview();
            }}
            className="text-xs text-muted hover:text-fg border border-border/60 rounded px-2 py-1 hover:border-fg/30 transition-colors whitespace-nowrap"
          >
            + Review
          </button>
        </td>
        {canExpand ? (
          <td className="py-3 pl-4 pr-2 text-muted">
            <span
              className={`inline-block transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
          </td>
        ) : (
          <td className="py-3 px-2" />
        )}
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-border/10">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenamePlace();
                  }}
                  className="text-xs text-muted hover:text-fg border border-border/60 rounded px-2 py-1 hover:border-fg/30 transition-colors"
                >
                  Rename
                </button>
                {(["lunch", "cafe", "sweets"] as const)
                  .filter((c) => c !== place.category)
                  .map((c) => (
                    <button
                      key={c}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePlace(c);
                      }}
                      className="text-xs text-muted hover:text-fg border border-border/60 rounded px-2 py-1 hover:border-fg/30 transition-colors"
                    >
                      Move to {c === "lunch" ? "Lunch" : c === "cafe" ? "Cafés" : "Sweets"}
                    </button>
                  ))}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlace();
                  }}
                  className="text-xs text-accent hover:text-accent/80 border border-accent/30 rounded px-2 py-1 hover:border-accent/60 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
