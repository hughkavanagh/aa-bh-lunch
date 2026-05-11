import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  try {
    const { password, place_id, category, name } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!place_id) {
      return NextResponse.json({ error: "Missing place ID" }, { status: 400 });
    }

    if (category !== undefined && !["lunch", "cafe", "sweets"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (category !== undefined) updates.category = category;
    if (name !== undefined) updates.name = name.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const db = createServiceClient();

    const { error } = await db
      .from("places")
      .update(updates)
      .eq("id", place_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update place" },
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
    const { password, place_id } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!place_id) {
      return NextResponse.json({ error: "Missing place ID" }, { status: 400 });
    }

    const db = createServiceClient();

    // Delete all reviews for this place first
    await db.from("reviews").delete().eq("place_id", place_id);

    const { error } = await db.from("places").delete().eq("id", place_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete place" },
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
