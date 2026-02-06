import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/queue/[id]/vote - Toggle vote on a queue item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get current user ID
    const { data: user } = await supabase
      .from("users")
      .select("id, username")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: queueItemId } = await params;

    // Get queue item and verify it exists
    const { data: queueItem } = await supabase
      .from("queue_items")
      .select("*, users!queue_items_user_id_fkey(id, username, email)")
      .eq("id", queueItemId)
      .single();

    if (!queueItem) {
      return NextResponse.json(
        { error: "Queue item not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to vote on their own queue
    if (queueItem.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own queue items" },
        { status: 403 }
      );
    }

    // Check if users are friends
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${queueItem.user_id}),and(user_id.eq.${queueItem.user_id},friend_id.eq.${user.id})`
      )
      .eq("status", "accepted")
      .single();

    if (!friendship) {
      return NextResponse.json(
        { error: "Can only vote on friends' queue items" },
        { status: 403 }
      );
    }

    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from("queue_votes")
      .select("*")
      .eq("queue_item_id", queueItemId)
      .eq("user_id", user.id)
      .single();

    let action: "voted" | "unvoted";

    if (existingVote) {
      // Remove vote
      const { error } = await supabase
        .from("queue_votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) {
        console.error("Error removing vote:", error);
        return NextResponse.json(
          { error: "Failed to remove vote" },
          { status: 500 }
        );
      }

      action = "unvoted";
    } else {
      // Add vote
      const { error } = await supabase.from("queue_votes").insert({
        queue_item_id: queueItemId,
        user_id: user.id,
      });

      if (error) {
        console.error("Error adding vote:", error);
        return NextResponse.json(
          { error: "Failed to add vote" },
          { status: 500 }
        );
      }

      action = "voted";

      // Create notification for queue owner
      await supabase.from("notifications").insert({
        user_id: queueItem.user_id,
        type: "recommendation",
        title: "Friend voted on your queue",
        message: `${user.username || session.user.email} voted for an item in your queue`,
        link: "/queue",
        is_read: false,
        actor_id: user.id,
        actor_username: user.username,
        actor_avatar: session.user.image,
      });
    }

    // Get updated vote count
    const { count } = await supabase
      .from("queue_votes")
      .select("*", { count: "exact", head: true })
      .eq("queue_item_id", queueItemId);

    return NextResponse.json({
      success: true,
      action,
      vote_count: count || 0,
    });
  } catch (error) {
    console.error("Vote toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/queue/[id]/vote - Get votes for a queue item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: queueItemId } = await params;
    const supabase = createClient();

    // Get current user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get queue item to verify ownership
    const { data: queueItem } = await supabase
      .from("queue_items")
      .select("user_id")
      .eq("id", queueItemId)
      .single();

    if (!queueItem) {
      return NextResponse.json(
        { error: "Queue item not found" },
        { status: 404 }
      );
    }

    // Only queue owner can see who voted
    if (queueItem.user_id !== user.id) {
      return NextResponse.json(
        { error: "Can only view votes on your own queue items" },
        { status: 403 }
      );
    }

    // Get all votes with user details
    const { data: votes, error } = await supabase
      .from("queue_votes")
      .select(
        `
        *,
        users!queue_votes_user_id_fkey(id, username, email, avatar)
      `
      )
      .eq("queue_item_id", queueItemId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching votes:", error);
      return NextResponse.json(
        { error: "Failed to fetch votes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      votes: votes || [],
      vote_count: votes?.length || 0,
    });
  } catch (error) {
    console.error("Get votes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
