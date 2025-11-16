import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json(
        { error: "Item ID is required" },
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

    // Remove item
    const { error: deleteError } = await supabase
      .from("collection_items")
      .delete()
      .eq("id", item_id)
      .eq("collection_id", id);

    if (deleteError) {
      console.error("Error removing item:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove item" },
        { status: 500 }
      );
    }

    // Update item count
    await supabase
      .from("cross_media_collections")
      .update({ item_count: Math.max(0, collection.item_count - 1) })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
