import { NextRequest, NextResponse } from "next/server";

const OFFICE_ORIGIN = "148 Mercer St, New York, NY 10012";

async function followRedirects(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  return res.url;
}

function extractPlaceId(url: string): string | null {
  const match = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  if (match) return match[1];

  const ftidMatch = url.match(/ftid=(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  if (ftidMatch) return null;

  return null;
}

function extractSearchQuery(url: string): string | null {
  const patterns = [
    /place\/([^/@]+)/,
    /search\/([^/@]+)/,
    /[?&]q=([^&]+)/,
    /query=([^&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return decodeURIComponent(match[1].replace(/\+/g, " "));
  }
  return null;
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
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.location",
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

export async function POST(req: NextRequest) {
  try {
    const { url: rawUrl, password } = await req.json();

    if (password !== process.env.OFFICE_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "Please provide a Google Maps URL" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY!;

    const expandedUrl = await followRedirects(rawUrl);

    let placeId = extractPlaceId(expandedUrl);
    let name: string;
    let lat: number;
    let lng: number;
    let canonicalUrl = expandedUrl;

    if (placeId) {
      const details = await getPlaceDetails(placeId, apiKey);
      if (!details) {
        return NextResponse.json(
          { error: "Could not find that place" },
          { status: 404 }
        );
      }
      name = details.name;
      lat = details.lat;
      lng = details.lng;
    } else {
      const query = extractSearchQuery(expandedUrl);
      if (!query) {
        return NextResponse.json(
          { error: "Could not extract a place from that URL. Try a different Google Maps link." },
          { status: 400 }
        );
      }

      const result = await findPlaceFromText(query, apiKey);
      if (!result) {
        return NextResponse.json(
          { error: `Could not find a place matching "${query}"` },
          { status: 404 }
        );
      }

      placeId = result.placeId;
      name = result.name;
      lat = result.lat;
      lng = result.lng;
    }

    canonicalUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const walkMinutes = await getWalkMinutes(lat, lng, apiKey);

    return NextResponse.json({
      google_place_id: placeId,
      name,
      walk_minutes: walkMinutes,
      google_maps_url: canonicalUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong resolving that URL" },
      { status: 500 }
    );
  }
}
