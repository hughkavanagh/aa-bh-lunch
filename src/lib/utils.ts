import type { Place, PlaceWithStats } from "@/types";

export function computeStats(place: Place): PlaceWithStats {
  const reviews = place.reviews ?? [];
  const count = reviews.length;

  if (count === 0) {
    return {
      ...place,
      avg_rating: 0,
      avg_price: 0,
      rating_per_dollar: 0,
      review_count: 0,
    };
  }

  const avg_rating =
    reviews.reduce((sum, r) => sum + Number(r.rating), 0) / count;
  const avg_price =
    reviews.reduce((sum, r) => sum + Number(r.price), 0) / count;
  const rating_per_dollar =
    avg_price > 0 ? (avg_rating / avg_price) * 10 : 0;

  return {
    ...place,
    avg_rating,
    avg_price,
    rating_per_dollar,
    review_count: count,
  };
}

export function formatPrice(price: number): string {
  if (price === 0) return "$0";
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
