import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchMediaItemsForUserMedia } from "@/lib/db/media-helpers";
import type { UserMedia } from "@/types/database";

// Force dynamic rendering - don't statically generate this route
export const dynamic = 'force-dynamic';

interface Match {
  user1_id: string;
  user2_id: string;
}

interface UserActivity {
  user_id: string;
  media_id: string;
  media_type: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  username: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's matches (friends/connections)
    const { data: matches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .gte("similarity_score", 70); // Only friends with 70%+ compatibility

    if (!matches || matches.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // Extract friend user IDs
    const friendIds = matches.map((match: Match) =>
      match.user1_id === userId ? match.user2_id : match.user1_id
    );

    // Get recent activity from friends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: friendActivity } = await supabase
      .from("user_media")
      .select("user_id, media_id, media_type, rating, created_at, updated_at")
      .in("user_id", friendIds)
      .gte("updated_at", sevenDaysAgo.toISOString())
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!friendActivity || friendActivity.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // Get user info for each activity
    const { data: users } = await supabase
      .from("users")
      .select("id, username")
      .in("id", friendIds);

    const userMap = new Map(users?.map((u: User) => [u.id, u.username]) || []);

    // Fetch media items
    const mediaMap = await fetchMediaItemsForUserMedia(friendActivity as UserMedia[]);

    // Build activity feed
    const activities = friendActivity.map((activity: UserActivity) => {
      const mediaItem = mediaMap.get(activity.media_id);
      const isNew =
        new Date(activity.created_at).getTime() ===
        new Date(activity.updated_at).getTime();

      return {
        id: `${activity.user_id}-${activity.media_id}`,
        user_id: activity.user_id,
        username: userMap.get(activity.user_id) || "Someone",
        action: isNew ? "rated" : "updated rating for",
        media_id: activity.media_id,
        media_type: activity.media_type,
        media_title: mediaItem?.title || "Unknown",
        media_cover: mediaItem?.poster_url,
        rating: activity.rating,
        timestamp: activity.updated_at,
      };
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching social activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
