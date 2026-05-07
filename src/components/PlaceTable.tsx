"use client";

import type { PlaceWithStats, SortField, SortDirection, Review } from "@/types";
import PlaceRow from "./PlaceRow";

const COLUMNS: { label: string; field: SortField | null }[] = [
  { label: "Place", field: null },
  { label: "Rating", field: "avg_rating" },
  { label: "Avg Price", field: "avg_price" },
  { label: "Walk", field: "walk_minutes" },
  { label: "Rating / $", field: "rating_per_dollar" },
  { label: "Reviews", field: "review_count" },
];

interface PlaceTableProps {
  places: PlaceWithStats[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  expandedId: string | null;
  onToggle: (id: string) => void;
  myReviewIds: string[];
  isAdmin: boolean;
  onEditReview: (review: Review) => void;
  onDeleteReview: (review: Review) => void;
}

export default function PlaceTable({
  places,
  sortField,
  sortDirection,
  onSort,
  expandedId,
  onToggle,
  myReviewIds,
  isAdmin,
  onEditReview,
  onDeleteReview,
}: PlaceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                onClick={col.field ? () => onSort(col.field!) : undefined}
                className={`py-3 px-4 text-xs font-medium tracking-widest uppercase text-muted ${
                  col.field ? "cursor-pointer hover:text-fg select-none" : ""
                } ${col.field ? "text-right" : "text-left"}`}
              >
                {col.label}
                {col.field && sortField === col.field && (
                  <span className="ml-1 text-accent">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {places.map((place) => (
            <PlaceRow
              key={place.id}
              place={place}
              expanded={expandedId === place.id}
              onToggle={() => onToggle(place.id)}
              myReviewIds={myReviewIds}
              isAdmin={isAdmin}
              onEditReview={onEditReview}
              onDeleteReview={onDeleteReview}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
