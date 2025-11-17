import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/collections/[id] - Get a specific collection with its items
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const supabase = createClient();

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this collection
    const isOwner = session?.user?.id === collection.user_id;
    if (!collection.is_public && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get collection items
    const { data: items, error: itemsError } = await supabase
      .from("collection_items")
      .select("*")
      .eq("collection_id", id)
      .order("position", { ascending: true });

    if (itemsError) {
      console.error("Error fetching collection items:", itemsError);
    }

    // Fetch media details for each item
    const itemsWithMedia = await Promise.all(
      (items || []).map(async (item) => {
        const { data: media } = await supabase
          .from(item.media_type === "anime" ? "anime" : item.media_type === "manga" ? "manga" : item.media_type === "book" ? "books" : item.media_type === "movie" ? "movies" : "music")
          .select("*")
          .eq("id", item.media_id)
          .single();

        return {
          ...item,
          media,
        };
      })
    );

    return NextResponse.json({
      collection,
      items: itemsWithMedia,
    });
  } catch (error) {
    console.error("Get collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/collections/[id] - Update a collection
export async function PUT(
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

    // Check ownership
    const { data: collection } = await supabase
      .from("collections")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, is_public, is_collaborative } = body;

    const { data: updated, error } = await supabase
      .from("collections")
      .update({
        title: title?.trim(),
        description: description?.trim() || null,
        is_public,
        is_collaborative,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating collection:", error);
      return NextResponse.json(
        { error: "Failed to update collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection: updated });
  } catch (error) {
    console.error("Update collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
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

    // Check ownership
    const { data: collection } = await supabase
      .from("collections")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting collection:", error);
      return NextResponse.json(
        { error: "Failed to delete collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
