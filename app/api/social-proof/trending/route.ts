import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchMediaItemsForUserMedia } from "@/lib/db/media-helpers";
import type { UserMedia } from "@/types/database";

interface NetworkRating {
  media_id: string;
  media_type: string;
  rating: number;
  updated_at: string;
}

interface MediaCountEntry {
  count: number;
  totalRating: number;
  media_type: string;
}

interface TrendingMediaId {
  media_id: string;
  media_type: string;
  friend_count: number;
  avg_rating: number;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's matches (network)
    const { data: matches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .gte("similarity_score", 60);

    if (!matches || matches.length === 0) {
      return NextResponse.json({ trending: [] });
    }

    // Extract friend user IDs
    const friendIds = matches.map((match) =>
      match.user1_id === userId ? match.user2_id : match.user1_id
    );

    // Get recent ratings from network (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: networkRatings } = await supabase
      .from("user_media")
      .select("media_id, media_type, rating, updated_at")
      .in("user_id", friendIds)
      .gte("updated_at", thirtyDaysAgo.toISOString())
      .gte("rating", 8); // Only highly rated items

    if (!networkRatings || networkRatings.length === 0) {
      return NextResponse.json({ trending: [] });
    }

    // Count how many friends rated each item
    const mediaCount = new Map<
      string,
      MediaCountEntry
    >();

    networkRatings.forEach((rating: NetworkRating) => {
      const key = rating.media_id;
      const existing = mediaCount.get(key);

      if (existing) {
        existing.count++;
        existing.totalRating += rating.rating || 0;
      } else {
        mediaCount.set(key, {
          count: 1,
          totalRating: rating.rating || 0,
          media_type: rating.media_type,
        });
      }
    });

    // Sort by count (most popular) and take top 20
    const trendingMediaIds: TrendingMediaId[] = Array.from(mediaCount.entries())
      .filter(([_, data]) => data.count >= 2) // At least 2 friends rated it
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([mediaId, data]) => ({
        media_id: mediaId,
        media_type: data.media_type,
        friend_count: data.count,
        avg_rating: data.totalRating / data.count,
      }));

    // Fetch media details
    const mediaMap = await fetchMediaItemsForUserMedia(
      trendingMediaIds.map((item) => ({
        media_id: item.media_id,
        media_type: item.media_type,
        rating: item.avg_rating,
      })) as unknown as UserMedia[]
    );

    // Build trending items
    const trending = trendingMediaIds
      .map((item) => {
        const mediaItem = mediaMap.get(item.media_id);
        if (!mediaItem) return null;

        return {
          media_id: item.media_id,
          media_type: item.media_type,
          title: mediaItem.title,
          cover: mediaItem.poster_url,
          genre: mediaItem.genre,
          friend_count: item.friend_count,
          avg_rating: Math.round(item.avg_rating * 10) / 10,
          author: (mediaItem as { author?: string }).author,
          artist: (mediaItem as { artist?: string }).artist,
          year: (mediaItem as { year?: number }).year,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("Error fetching trending items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
