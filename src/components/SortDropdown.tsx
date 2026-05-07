"use client";

import type { SortField, SortDirection } from "@/types";

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: "Name", field: "name" },
  { label: "Rating", field: "avg_rating" },
  { label: "Price", field: "avg_price" },
  { label: "Walk time", field: "walk_minutes" },
  { label: "Rating / $", field: "rating_per_dollar" },
  { label: "Reviews", field: "review_count" },
];

interface SortDropdownProps {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}

export default function SortDropdown({
  field,
  direction,
  onChange,
}: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={field}
        onChange={(e) => onChange(e.target.value as SortField, direction)}
        className="bg-surface border border-border rounded-md px-3 py-1.5 text-xs uppercase tracking-wider text-fg"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.field} value={opt.field}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => onChange(field, direction === "asc" ? "desc" : "asc")}
        className="text-muted hover:text-fg text-sm"
        title={direction === "asc" ? "Ascending" : "Descending"}
      >
        {direction === "asc" ? "↑" : "↓"}
      </button>
    </div>
  );
}
