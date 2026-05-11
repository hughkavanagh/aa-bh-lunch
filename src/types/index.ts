export interface Place {
  id: string;
  google_place_id: string;
  name: string;
  category: "lunch" | "cafe" | "sweets";
  walk_minutes: number;
  google_maps_url: string;
  created_at: string;
  reviews: Review[];
}

export interface Review {
  id: string;
  place_id: string;
  reviewer_name: string;
  rating: number;
  price: number;
  what_they_got: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PlaceWithStats extends Place {
  avg_rating: number;
  avg_price: number;
  rating_per_dollar: number;
  review_count: number;
}

export interface ResolvedPlace {
  google_place_id: string;
  name: string;
  walk_minutes: number;
  google_maps_url: string;
}

export type SortField =
  | "name"
  | "avg_rating"
  | "avg_price"
  | "walk_minutes"
  | "rating_per_dollar"
  | "review_count";

export type SortDirection = "asc" | "desc";
