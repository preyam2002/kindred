import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/collections/[id]/items - Add item to collection
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check ownership or collaborative permission
    const { data: collection } = await supabase
      .from("collections")
      .select("user_id, is_collaborative")
      .eq("id", id)
      .single();

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const isOwner = collection.user_id === user.id;
    if (!isOwner && !collection.is_collaborative) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { media_type, media_id, notes } = body;

    if (!media_type || !media_id) {
      return NextResponse.json(
        { error: "media_type and media_id are required" },
        { status: 400 }
      );
    }

    // Check if item already exists in collection
    const { data: existing } = await supabase
      .from("collection_items")
      .select("id")
      .eq("collection_id", id)
      .eq("media_type", media_type)
      .eq("media_id", media_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Item already in collection" },
        { status: 409 }
      );
    }

    // Get the highest position
    const { data: lastItem } = await supabase
      .from("collection_items")
      .select("position")
      .eq("collection_id", id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = lastItem ? lastItem.position + 1 : 0;

    const { data: item, error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: id,
        media_type,
        media_id,
        added_by_user_id: user.id,
        position,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding item to collection:", error);
      return NextResponse.json(
        { error: "Failed to add item to collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Add to collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
