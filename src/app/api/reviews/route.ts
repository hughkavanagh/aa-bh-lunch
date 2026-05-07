import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, google_place_id, name, category, walk_minutes, google_maps_url, reviewer_name, rating, price, what_they_got } = body;

    if (password !== process.env.OFFICE_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!google_place_id || !name || !category || !reviewer_name || !rating || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json({ error: "Rating must be between 1 and 10" }, { status: 400 });
    }

    if (price <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 });
    }

    const db = createServiceClient();

    const { data: existingPlace } = await db
      .from("places")
      .select("id")
      .eq("google_place_id", google_place_id)
      .single();

    let placeId: string;

    if (existingPlace) {
      placeId = existingPlace.id;
    } else {
      const { data: newPlace, error: placeError } = await db
        .from("places")
        .insert({
          google_place_id,
          name,
          category,
          walk_minutes,
          google_maps_url,
        })
        .select("id")
        .single();

      if (placeError || !newPlace) {
        return NextResponse.json(
          { error: "Failed to create place" },
          { status: 500 }
        );
      }

      placeId = newPlace.id;
    }

    const { data: review, error: reviewError } = await db
      .from("reviews")
      .insert({
        place_id: placeId,
        reviewer_name,
        rating,
        price,
        what_they_got: what_they_got || null,
      })
      .select("id")
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Failed to create review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: review.id, place_id: placeId });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, review_id, reviewer_name, rating, price, what_they_got, admin } = body;

    const expectedPassword = admin
      ? process.env.ADMIN_PASSWORD
      : process.env.OFFICE_PASSWORD;

    if (password !== expectedPassword) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!review_id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    if (rating !== undefined && (rating < 1 || rating > 10)) {
      return NextResponse.json({ error: "Rating must be between 1 and 10" }, { status: 400 });
    }

    if (price !== undefined && price <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 });
    }

    const db = createServiceClient();

    const updates: Record<string, unknown> = {};
    if (reviewer_name !== undefined) updates.reviewer_name = reviewer_name;
    if (rating !== undefined) updates.rating = rating;
    if (price !== undefined) updates.price = price;
    if (what_they_got !== undefined) updates.what_they_got = what_they_got || null;

    const { error } = await db
      .from("reviews")
      .update(updates)
      .eq("id", review_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, review_id, admin } = body;

    const expectedPassword = admin
      ? process.env.ADMIN_PASSWORD
      : process.env.OFFICE_PASSWORD;

    if (password !== expectedPassword) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!review_id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    const db = createServiceClient();

    const { data: review } = await db
      .from("reviews")
      .select("place_id")
      .eq("id", review_id)
      .single();

    const { error } = await db
      .from("reviews")
      .delete()
      .eq("id", review_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 }
      );
    }

    if (review) {
      const { count } = await db
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("place_id", review.place_id);

      if (count === 0) {
        await db.from("places").delete().eq("id", review.place_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
