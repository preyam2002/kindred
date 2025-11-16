import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { media_id, media_type, notes } = body;

    if (!media_id || !media_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if collection exists and user has permission
    const { data: collection, error: collectionError } = await supabase
      .from("cross_media_collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Check if user owns the collection or if it's collaborative
    if (
      collection.user_id !== session.user.email &&
      !collection.is_collaborative
    ) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get current max sort_order
    const { data: existingItems } = await supabase
      .from("collection_items")
      .select("sort_order")
      .eq("collection_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSortOrder =
      existingItems && existingItems.length > 0
        ? existingItems[0].sort_order + 1
        : 0;

    // Add item to collection
    const { data: item, error: itemError } = await supabase
      .from("collection_items")
      .insert({
        collection_id: id,
        media_type,
        media_id,
        sort_order: nextSortOrder,
        notes: notes || null,
        added_by: session.user.email,
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error adding item:", itemError);
      return NextResponse.json(
        { error: "Failed to add item" },
        { status: 500 }
      );
    }

    // Update item count
    await supabase
      .from("cross_media_collections")
      .update({ item_count: collection.item_count + 1 })
      .eq("id", id);

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
