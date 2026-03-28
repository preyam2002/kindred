import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// GET /api/queue - Get user's queue with optional sorting
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sort") || "position"; // position, priority, random, ai, social

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

    // Apply sorting (except for social which we'll do after getting vote counts)
    if (sortBy === "priority") {
      // High, Medium, Low
      query = query.order("priority", { ascending: false });
    } else if (sortBy === "random") {
      // Random order - we'll shuffle on the client side
      query = query.order("added_at", { ascending: false });
    } else if (sortBy === "ai") {
      // AI ranking: fetch all then sort by computed score
      query = query.order("added_at", { ascending: false });
    } else if (sortBy === "social") {
      // Social voting - we'll sort by vote count after fetching
      query = query.order("added_at", { ascending: false });
    } else {
      // Default: manual position
      query = query.order("position", { ascending: true });
    }

    const { data: queueItems, error } = await query;

    if (error) {
      logger.error("Error fetching queue", "queue", error);
      return NextResponse.json(
        { error: "Failed to fetch queue" },
        { status: 500 }
      );
    }

    // Fetch media details and vote counts for each item
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

        // Get vote count for this item
        const { count: voteCount } = await supabase
          .from("queue_votes")
          .select("*", { count: "exact", head: true })
          .eq("queue_item_id", item.id);

        return {
          ...item,
          media,
          vote_count: voteCount || 0,
        };
      })
    );

    // If AI sort, score each item based on user preferences and rank
    if (sortBy === "ai") {
      // Get user's ratings to understand preferences
      const { data: userMedia } = await supabase
        .from("user_media")
        .select("media_type, rating")
        .eq("user_id", user.id)
        .not("rating", "is", null);

      // Build preference profile: average rating per media type + genre affinity
      const typeScores: Record<string, { total: number; count: number }> = {};
      for (const um of userMedia || []) {
        if (!typeScores[um.media_type]) typeScores[um.media_type] = { total: 0, count: 0 };
        typeScores[um.media_type].total += um.rating;
        typeScores[um.media_type].count += 1;
      }

      // Get social vote boost
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

      // Score each queue item using a separate map to avoid mutating response objects
      const aiScores = new Map<number, number>();
      for (let i = 0; i < itemsWithMedia.length; i++) {
        const item = itemsWithMedia[i];
        let score = 0;

        // Priority weight (0-3)
        score += (priorityWeight[item.priority] || 1) * 10;

        // Type preference boost: if user rates this media type highly on avg, boost it
        const typeStats = typeScores[item.media_type];
        if (typeStats && typeStats.count > 0) {
          const avgRating = typeStats.total / typeStats.count;
          score += avgRating * 3; // 0-30 points
        }

        // Social signal: vote count
        score += (item.vote_count || 0) * 5;

        // Recency penalty: older items get slight boost to prevent starvation
        const ageMs = Date.now() - new Date(item.added_at).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        score += Math.min(ageDays * 0.5, 15); // Up to 15 points for older items

        // Genre match bonus
        if (item.media?.genre && Array.isArray(item.media.genre)) {
          score += item.media.genre.length * 2;
        }

        aiScores.set(i, score);
      }

      // Sort by AI score (stable sort preserving original indices)
      const indices = Array.from({ length: itemsWithMedia.length }, (_, i) => i);
      indices.sort((a, b) => (aiScores.get(b) || 0) - (aiScores.get(a) || 0));
      const sorted = indices.map((i) => itemsWithMedia[i]);
      itemsWithMedia.length = 0;
      itemsWithMedia.push(...sorted);
    }

    // If random sort, shuffle the results
    if (sortBy === "random") {
      for (let i = itemsWithMedia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [itemsWithMedia[i], itemsWithMedia[j]] = [itemsWithMedia[j], itemsWithMedia[i]];
      }
    }

    // If social sort, sort by vote count (highest first)
    if (sortBy === "social") {
      itemsWithMedia.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    }

    return NextResponse.json({ queue: itemsWithMedia });
  } catch (error) {
    logger.error("Queue error", "queue", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/queue - Add item to queue
export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { media_type, media_id, priority, notes } = body;

    const validMediaTypes = ["anime", "manga", "book", "movie", "music"];
    const validPriorities = ["low", "medium", "high"];

    if (!media_type || !media_id) {
      return NextResponse.json(
        { error: "media_type and media_id are required" },
        { status: 400 }
      );
    }

    if (!validMediaTypes.includes(media_type)) {
      return NextResponse.json(
        { error: `media_type must be one of: ${validMediaTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${validPriorities.join(", ")}` },
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
      logger.error("Error adding to queue", "queue", error);
      return NextResponse.json(
        { error: "Failed to add to queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    logger.error("Add to queue error", "queue", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
