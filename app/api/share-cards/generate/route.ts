import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchMediaItemsForUserMedia } from "@/lib/db/media-helpers";
import type { UserMedia } from "@/types/database";

interface UserMediaRecord {
  media_type: string;
  media_id: string;
  rating: number | null;
}

interface MediaItem {
  title: string;
  cover_image?: string;
  poster_url?: string;
}

interface EnrichedUserMedia extends UserMedia {
  media_item?: MediaItem;
}

interface Match {
  similarity_score: number;
  user1_id: string;
  user2_id: string;
}

interface CardData {
  username: string;
  cardType: string;
  items?: MediaItem[];
  title?: string;
  profile?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  compatibility?: Record<string, unknown>;
  streak?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardType = searchParams.get("type") || "top10";

    const userId = session.user.id;

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("username, bio")
      .eq("id", userId)
      .single();

    // Get taste profile
    const { data: tasteProfile } = await supabase
      .from("taste_profiles")
      .select("*")
      .eq("user_email", session.user.email)
      .single();

    // Get user's library
    const { data: userMediaRecords } = await supabase
      .from("user_media")
      .select("media_type, media_id, rating")
      .eq("user_id", userId)
      .order("rating", { ascending: false })
      .limit(50);

    const mediaMap = userMediaRecords
      ? await fetchMediaItemsForUserMedia(userMediaRecords as UserMedia[])
      : new Map();

    const userMedia: EnrichedUserMedia[] = userMediaRecords
      ? userMediaRecords.map((um: UserMediaRecord & { id?: string; user_id?: string }) => ({
          id: um.id || "",
          user_id: um.user_id || userId,
          media_type: (um.media_type || "movie") as "book" | "anime" | "manga" | "movie" | "music",
          media_id: um.media_id,
          rating: um.rating ?? undefined,
          timestamp: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          media_item: mediaMap.get(um.media_id),
        }))
      : [];

    // Get streak info
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak, total_points, level")
      .eq("user_email", session.user.email)
      .single();

    // Get matches count
    const { data: matches } = await supabase
      .from("matches")
      .select("similarity_score, user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const cardData: CardData = {
      username: userData?.username || "User",
      cardType,
    };

    switch (cardType) {
      case "top10":
        // Top 10 rated items
        const top10 = userMedia
          .filter((item): item is EnrichedUserMedia & { media_item: MediaItem } => item.media_item !== undefined && item.rating !== undefined && item.rating >= 8)
          .slice(0, 10)
          .map((item) => ({
            title: item.media_item.title,
            cover: item.media_item.cover_image || item.media_item.poster_url,
            rating: item.rating,
            type: item.media_type,
          }));

        cardData.items = top10;
        cardData.title = `${userData?.username}'s Top 10`;
        break;

      case "taste_profile":
        // Taste profile stats
        cardData.profile = {
          top_genres: tasteProfile?.top_genres?.slice(0, 5) || [],
          mainstream_score: tasteProfile?.mainstream_score || 50,
          diversity_score: tasteProfile?.diversity_score || 50,
          total_items: userMedia.length,
          avg_rating: tasteProfile?.rating_average || 0,
        };
        cardData.title = `${userData?.username}'s Taste DNA`;
        break;

      case "year_stats":
        // Year in review style
        const thisYear = new Date().getFullYear();
        const yearItems = userMedia.filter((item) => {
          // Would need created_at field to filter by year
          return true;
        });

        cardData.stats = {
          total_items: yearItems.length,
          top_genre: tasteProfile?.top_genres?.[0] || "Unknown",
          avg_rating: tasteProfile?.rating_average || 0,
          streak: streakData?.current_streak || 0,
          matches_count: matches?.length || 0,
        };
        cardData.title = `${userData?.username}'s ${thisYear} Wrapped`;
        break;

      case "compatibility":
        // Compatibility with best match
        const bestMatch = matches?.[0];
        if (bestMatch) {
          const matchUserId =
            bestMatch.user1_id === userId
              ? bestMatch.user2_id
              : bestMatch.user1_id;

          const { data: matchUser } = await supabase
            .from("users")
            .select("username")
            .eq("id", matchUserId)
            .single();

          cardData.compatibility = {
            match_username: matchUser?.username || "Someone",
            score: bestMatch.similarity_score || 0,
            shared_items: 0, // Would need to calculate
          };
          cardData.title = `${userData?.username} × ${matchUser?.username}`;
        } else {
          cardData.compatibility = {
            match_username: "No matches yet",
            score: 0,
            shared_items: 0,
          };
        }
        break;

      case "streak":
        // Gamification stats
        cardData.streak = {
          current_streak: streakData?.current_streak || 0,
          level: streakData?.level || 1,
          total_points: streakData?.total_points || 0,
        };
        cardData.title = `${userData?.username}'s Streak`;
        break;

      default:
        return NextResponse.json({ error: "Invalid card type" }, { status: 400 });
    }

    return NextResponse.json(cardData);
  } catch (error) {
    console.error("Error generating share card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
