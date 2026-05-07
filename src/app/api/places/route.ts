import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  try {
    const { password, place_id, category } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!place_id) {
      return NextResponse.json({ error: "Missing place ID" }, { status: 400 });
    }

    if (category !== "lunch" && category !== "cafe") {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const db = createServiceClient();

    const { error } = await db
      .from("places")
      .update({ category })
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
