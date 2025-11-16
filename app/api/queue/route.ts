import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/queue - Get user's queue with optional sorting
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sort") || "position"; // position, priority, random, ai

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

    // Fetch queue items
    let query = supabase
      .from("queue_items")
      .select("*")
      .eq("user_id", user.id);

    // Apply sorting
    if (sortBy === "priority") {
      // High, Medium, Low
      query = query.order("priority", { ascending: false });
    } else if (sortBy === "random") {
      // Random order - we'll shuffle on the client side
      query = query.order("added_at", { ascending: false });
    } else if (sortBy === "ai") {
      // AI order - for now, use priority + position
      // TODO: Implement actual AI ranking
      query = query.order("priority", { ascending: false }).order("position", { ascending: true });
    } else {
      // Default: manual position
      query = query.order("position", { ascending: true });
    }

    const { data: queueItems, error } = await query;

    if (error) {
      console.error("Error fetching queue:", error);
      return NextResponse.json(
        { error: "Failed to fetch queue" },
        { status: 500 }
      );
    }

    // Fetch media details for each item
    const itemsWithMedia = await Promise.all(
      (queueItems || []).map(async (item) => {
        const tableName =
          item.media_type === "anime" ? "anime" :
          item.media_type === "manga" ? "manga" :
          item.media_type === "book" ? "books" :
          item.media_type === "movie" ? "movies" : "music";

        const { data: media } = await supabase
          .from(tableName)
          .select("*")
          .eq("id", item.media_id)
          .single();

        return {
          ...item,
          media,
        };
      })
    );

    // If random sort, shuffle the results
    if (sortBy === "random") {
      for (let i = itemsWithMedia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [itemsWithMedia[i], itemsWithMedia[j]] = [itemsWithMedia[j], itemsWithMedia[i]];
      }
    }

    return NextResponse.json({ queue: itemsWithMedia });
  } catch (error) {
    console.error("Queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/queue - Add item to queue
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

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

    const body = await request.json();
    const { media_type, media_id, priority, notes } = body;

    if (!media_type || !media_id) {
      return NextResponse.json(
        { error: "media_type and media_id are required" },
        { status: 400 }
      );
    }

    // Check if item already in queue
    const { data: existing } = await supabase
      .from("queue_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("media_type", media_type)
      .eq("media_id", media_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Item already in queue" },
        { status: 409 }
      );
    }

    // Get the highest position
    const { data: lastItem } = await supabase
      .from("queue_items")
      .select("position")
      .eq("user_id", user.id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = lastItem ? lastItem.position + 1 : 0;

    const { data: item, error } = await supabase
      .from("queue_items")
      .insert({
        user_id: user.id,
        media_type,
        media_id,
        position,
        priority: priority || "medium",
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to queue:", error);
      return NextResponse.json(
        { error: "Failed to add to queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Add to queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
