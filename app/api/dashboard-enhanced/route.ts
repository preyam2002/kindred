import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Fetch streak data
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, total_points, level")
      .eq("user_email", userEmail)
      .single();

    // Fetch today's challenges
    const { data: challenges } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_email", userEmail)
      .single();

    // Fetch trending in network
    const { data: matches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .gte("similarity_score", 60)
      .limit(20);

    let trendingItems = [];
    if (matches && matches.length > 0) {
      const friendIds = matches.map((m: any) =>
        m.user1_id === userId ? m.user2_id : m.user1_id
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);

      const { data: recentRatings } = await supabase
        .from("user_media")
        .select("media_id, media_type")
        .in("user_id", friendIds)
        .gte("updated_at", thirtyDaysAgo.toISOString())
        .gte("rating", 8)
        .limit(50);

      if (recentRatings && recentRatings.length > 0) {
        const mediaCount = new Map();
        recentRatings.forEach((r: any) => {
          const key = r.media_id;
          mediaCount.set(key, (mediaCount.get(key) || 0) + 1);
        });

        const topItems = Array.from(mediaCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([mediaId, count]) => ({
            media_id: mediaId,
            friend_count: count,
          }));

        trendingItems = topItems;
      }
    }

    // Calculate daily challenge progress
    const today = new Date().toISOString().split("T")[0];
    const { data: todayRatings } = await supabase
      .from("user_media")
      .select("rating, created_at")
      .eq("user_id", userId)
      .gte("created_at", today);

    const dailyChallengeProgress = {
      ratings_today: todayRatings?.length || 0,
      goal: 5,
      completed: (todayRatings?.length || 0) >= 5,
    };

    // Get recent friend activity
    const { data: friendActivity } = matches && matches.length > 0
      ? await supabase
          .from("user_media")
          .select("user_id, media_id, rating, updated_at")
          .in(
            "user_id",
            matches.map((m: any) =>
              m.user1_id === userId ? m.user2_id : m.user1_id
            )
          )
          .order("updated_at", { ascending: false })
          .limit(5)
      : { data: [] };

    return NextResponse.json({
      streak: streakData || {
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        level: 1,
      },
      daily_challenge: dailyChallengeProgress,
      trending_in_network: trendingItems,
      recent_friend_activity: friendActivity || [],
      total_friends: matches?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching enhanced dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
