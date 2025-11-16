import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json(
        { error: "Media ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get user's matches (friends)
    const { data: matches } = await supabase
      .from("matches")
      .select("user1_id, user2_id, similarity_score")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .gte("similarity_score", 60);

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        friend_count: 0,
        friends: [],
        avg_rating: 0,
      });
    }

    // Extract friend user IDs
    const friendIds = matches.map((match: any) =>
      match.user1_id === userId ? match.user2_id : match.user1_id
    );

    // Get ratings from friends for this item
    const { data: friendRatings } = await supabase
      .from("user_media")
      .select("user_id, rating")
      .eq("media_id", mediaId)
      .in("user_id", friendIds)
      .not("rating", "is", null);

    if (!friendRatings || friendRatings.length === 0) {
      return NextResponse.json({
        friend_count: 0,
        friends: [],
        avg_rating: 0,
      });
    }

    // Get usernames
    const { data: users } = await supabase
      .from("users")
      .select("id, username")
      .in(
        "id",
        friendRatings.map((r: any) => r.user_id)
      );

    const userMap = new Map(users?.map((u: any) => [u.id, u.username]) || []);

    const friends = friendRatings.map((rating: any) => ({
      user_id: rating.user_id,
      username: userMap.get(rating.user_id) || "Someone",
      rating: rating.rating,
    }));

    const avgRating =
      friendRatings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
      friendRatings.length;

    return NextResponse.json({
      friend_count: friendRatings.length,
      friends: friends.slice(0, 5), // Show max 5 friends
      avg_rating: Math.round(avgRating * 10) / 10,
      has_more: friendRatings.length > 5,
    });
  } catch (error) {
    console.error("Error fetching item social proof:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
