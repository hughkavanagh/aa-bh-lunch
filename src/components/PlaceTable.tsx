"use client";

import type { PlaceWithStats, SortField, SortDirection, Review } from "@/types";
import PlaceRow from "./PlaceRow";

const COLUMNS: { label: string; field: SortField }[] = [
  { label: "Place", field: "name" },
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
  highlightedId?: string | null;
  onToggle: (id: string) => void;
  myReviewIds: string[];
  isAdmin: boolean;
  onEditReview: (review: Review) => void;
  onDeleteReview: (review: Review) => void;
  onAddReview: (place: PlaceWithStats) => void;
  onDeletePlace: (place: PlaceWithStats) => void;
  onMovePlace: (place: PlaceWithStats, target: string) => void;
  onRenamePlace: (place: PlaceWithStats) => void;
  unreviewedPlaces?: PlaceWithStats[];
}

export default function PlaceTable({
  places,
  sortField,
  sortDirection,
  onSort,
  expandedId,
  highlightedId,
  onToggle,
  myReviewIds,
  isAdmin,
  onEditReview,
  onDeleteReview,
  onAddReview,
  onDeletePlace,
  onMovePlace,
  onRenamePlace,
  unreviewedPlaces,
}: PlaceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth: "800px" }}>
        <colgroup>
          <col style={{ width: "35%" }} />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col style={{ width: "80px" }} />
          <col style={{ width: "48px" }} />
        </colgroup>
        <thead>
          <tr className="border-b-2 border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                onClick={() => onSort(col.field)}
                className="py-3 px-5 text-xs font-medium tracking-widest uppercase text-muted whitespace-nowrap cursor-pointer hover:text-fg select-none text-left"
              >
                {col.label}
                <span
                  className={`ml-1 inline-block w-3 ${
                    sortField === col.field ? "text-accent" : "text-transparent"
                  }`}
                >
                  {sortField === col.field
                    ? sortDirection === "asc"
                      ? "↑"
                      : "↓"
                    : "↓"}
                </span>
              </th>
            ))}
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {places.map((place) => (
            <PlaceRow
              key={place.id}
              place={place}
              expanded={expandedId === place.id}
              highlighted={highlightedId === place.id}
              onToggle={() => onToggle(place.id)}
              myReviewIds={myReviewIds}
              isAdmin={isAdmin}
              onEditReview={onEditReview}
              onDeleteReview={onDeleteReview}
              onAddReview={() => onAddReview(place)}
              onDeletePlace={() => onDeletePlace(place)}
              onMovePlace={(target) => onMovePlace(place, target)}
              onRenamePlace={() => onRenamePlace(place)}
            />
          ))}
        </tbody>
        {unreviewedPlaces && unreviewedPlaces.length > 0 && (
          <>
            <tbody>
              <tr>
                <td colSpan={8} className="pt-14 pb-4 px-5">
                  <div className="border-t border-muted/20" />
                  <p className="text-xs uppercase tracking-widest text-muted/50 font-medium mt-4">
                    Unreviewed
                  </p>
                </td>
              </tr>
            </tbody>
            <tbody>
              {unreviewedPlaces.map((place) => (
                <PlaceRow
                  key={place.id}
                  place={place}
                  expanded={expandedId === place.id}
                  highlighted={highlightedId === place.id}
                  onToggle={() => onToggle(place.id)}
                  myReviewIds={myReviewIds}
                  isAdmin={isAdmin}
                  onEditReview={onEditReview}
                  onDeleteReview={onDeleteReview}
                  onAddReview={() => onAddReview(place)}
                  onDeletePlace={() => onDeletePlace(place)}
                  onMovePlace={(target) => onMovePlace(place, target)}
                  onRenamePlace={() => onRenamePlace(place)}
                  unreviewed
                />
              ))}
            </tbody>
          </>
        )}
      </table>
    </div>
  );
}
