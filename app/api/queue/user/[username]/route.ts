import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/queue/user/[username] - Get a friend's queue
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    const supabase = createClient();

    // Get current user ID
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get target user by username
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, username, email, avatar")
      .eq("username", username)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if users are friends
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(user_id.eq.${currentUser.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${currentUser.id})`
      )
      .eq("status", "accepted")
      .single();

    if (!friendship) {
      return NextResponse.json(
        { error: "You must be friends to view this queue" },
        { status: 403 }
      );
    }

    // Fetch target user's queue
    const { data: queueItems, error } = await supabase
      .from("queue_items")
      .select("*")
      .eq("user_id", targetUser.id)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching queue:", error);
      return NextResponse.json(
        { error: "Failed to fetch queue" },
        { status: 500 }
      );
    }

    // Fetch media details, vote counts, and check if current user has voted
    const itemsWithMedia = await Promise.all(
      (queueItems || []).map(async (item) => {
        const tableName =
          item.media_type === "anime"
            ? "anime"
            : item.media_type === "manga"
            ? "manga"
            : item.media_type === "book"
            ? "books"
            : item.media_type === "movie"
            ? "movies"
            : "music";

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

        // Check if current user has voted
        const { data: userVote } = await supabase
          .from("queue_votes")
          .select("id")
          .eq("queue_item_id", item.id)
          .eq("user_id", currentUser.id)
          .single();

        return {
          ...item,
          media,
          vote_count: voteCount || 0,
          has_voted: !!userVote,
        };
      })
    );

    return NextResponse.json({
      queue: itemsWithMedia,
      user: targetUser,
    });
  } catch (error) {
    console.error("Get friend queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
