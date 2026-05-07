import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const OFFICE_ORIGIN = "148 Mercer St, New York, NY 10012";

async function followRedirects(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  return res.url;
}

function extractSearchQuery(url: string): string | null {
  const patterns = [/place\/([^/@]+)/, /search\/([^/@]+)/, /query=([^&]+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return decodeURIComponent(match[1].replace(/\+/g, " "));
  }
  return null;
}

function extractPlaceId(url: string): string | null {
  const match = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function findPlaceFromText(
  query: string,
  apiKey: string
): Promise<{ placeId: string; name: string; lat: number; lng: number } | null> {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location",
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: 40.7264, longitude: -73.9977 },
            radius: 2000.0,
          },
        },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;
  return {
    placeId: place.id,
    name: place.displayName?.text ?? "",
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
  };
}

async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<{ name: string; lat: number; lng: number } | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,location",
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.displayName?.text ?? "",
    lat: data.location?.latitude ?? 0,
    lng: data.location?.longitude ?? 0,
  };
}

async function getWalkMinutes(
  lat: number,
  lng: number,
  apiKey: string
): Promise<number> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(OFFICE_ORIGIN)}` +
      `&destinations=${lat},${lng}` +
      `&mode=walking` +
      `&key=${apiKey}`
  );
  if (!res.ok) return 0;
  const data = await res.json();
  const duration = data.rows?.[0]?.elements?.[0]?.duration?.value;
  if (!duration) return 0;
  return Math.ceil(duration / 60);
}

interface BatchResult {
  url: string;
  success: boolean;
  name?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { password, urls, category } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    if (!category || (category !== "lunch" && category !== "cafe")) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
    const db = createServiceClient();
    const results: BatchResult[] = [];

    for (const rawUrl of urls) {
      try {
        const expandedUrl = await followRedirects(rawUrl);
        let placeId = extractPlaceId(expandedUrl);
        let name: string;
        let lat: number;
        let lng: number;

        if (placeId) {
          const details = await getPlaceDetails(placeId, apiKey);
          if (!details) {
            results.push({ url: rawUrl, success: false, error: "Place not found" });
            continue;
          }
          name = details.name;
          lat = details.lat;
          lng = details.lng;
        } else {
          const query = extractSearchQuery(expandedUrl);
          if (!query) {
            results.push({ url: rawUrl, success: false, error: "Could not parse URL" });
            continue;
          }
          const result = await findPlaceFromText(query, apiKey);
          if (!result) {
            results.push({ url: rawUrl, success: false, error: `No match for "${query}"` });
            continue;
          }
          placeId = result.placeId;
          name = result.name;
          lat = result.lat;
          lng = result.lng;
        }

        const { data: existing } = await db
          .from("places")
          .select("id")
          .eq("google_place_id", placeId)
          .single();

        if (existing) {
          results.push({ url: rawUrl, success: true, name, error: "Already exists" });
          continue;
        }

        const walkMinutes = await getWalkMinutes(lat, lng, apiKey);
        const canonicalUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

        const { error } = await db.from("places").insert({
          google_place_id: placeId,
          name,
          category,
          walk_minutes: walkMinutes,
          google_maps_url: canonicalUrl,
        });

        if (error) {
          results.push({ url: rawUrl, success: false, name, error: "DB insert failed" });
        } else {
          results.push({ url: rawUrl, success: true, name });
        }
      } catch {
        results.push({ url: rawUrl, success: false, error: "Failed to process" });
      }
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
