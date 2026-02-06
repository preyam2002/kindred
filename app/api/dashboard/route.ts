import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { calculateMashScore } from "@/lib/matching";
import { fetchMediaItemsForUserMedia } from "@/lib/db/media-helpers";
import type { UserMedia, Match, User } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's media stats
    const { data: userMedia, error: mediaError } = await supabase
      .from("user_media")
      .select("media_type, rating")
      .eq("user_id", userId);

    if (mediaError) {
      console.error("Error fetching user media:", mediaError);
    }

    const userMediaData = (userMedia ?? []) as Array<
      Pick<UserMedia, "media_type" | "rating">
    >;

    const mediaCounts = {
      total: userMediaData.length,
      books: userMediaData.filter((m) => m.media_type === "book").length,
      anime: userMediaData.filter((m) => m.media_type === "anime").length,
      manga: userMediaData.filter((m) => m.media_type === "manga").length,
      movies: userMediaData.filter((m) => m.media_type === "movie").length,
      music: userMediaData.filter((m) => m.media_type === "music").length,
    };

    type MediaType = UserMedia["media_type"];
    const ratingTotals: Record<MediaType, { sum: number; count: number }> = {
      book: { sum: 0, count: 0 },
      anime: { sum: 0, count: 0 },
      manga: { sum: 0, count: 0 },
      movie: { sum: 0, count: 0 },
      music: { sum: 0, count: 0 },
    };

    let overallSum = 0;
    let overallCount = 0;

    for (const item of userMediaData) {
      const mediaType = item.media_type;
      const rating = item.rating;
      if (
        mediaType &&
        ratingTotals[mediaType] &&
        rating !== null &&
        rating !== undefined
      ) {
        ratingTotals[mediaType].sum += rating;
        ratingTotals[mediaType].count += 1;
        overallSum += rating;
        overallCount += 1;
      }
    }

    const averageRatings = {
      overall: overallCount > 0 ? Number((overallSum / overallCount).toFixed(1)) : null,
      books:
        ratingTotals.book.count > 0
          ? Number((ratingTotals.book.sum / ratingTotals.book.count).toFixed(1))
          : null,
      anime:
        ratingTotals.anime.count > 0
          ? Number((ratingTotals.anime.sum / ratingTotals.anime.count).toFixed(1))
          : null,
      manga:
        ratingTotals.manga.count > 0
          ? Number((ratingTotals.manga.sum / ratingTotals.manga.count).toFixed(1))
          : null,
      movies:
        ratingTotals.movie.count > 0
          ? Number((ratingTotals.movie.sum / ratingTotals.movie.count).toFixed(1))
          : null,
      music:
        ratingTotals.music.count > 0
          ? Number((ratingTotals.music.sum / ratingTotals.music.count).toFixed(1))
          : null,
    };

    const ratedCounts = {
      overall: overallCount,
      books: ratingTotals.book.count,
      anime: ratingTotals.anime.count,
      manga: ratingTotals.manga.count,
      movies: ratingTotals.movie.count,
      music: ratingTotals.music.count,
    };

    // Get connected integrations
    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("source_name, created_at")
      .eq("user_id", userId);

    if (sourcesError) {
      console.error("Error fetching sources:", sourcesError);
    }

    // Get recent matches (top 5 by score)
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("similarity_score", { ascending: false })
      .limit(5);

    // Fetch user details for matches
    let enrichedMatches = [];
    if (matches && !matchesError) {
      for (const match of matches) {
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const { data: otherUser } = await supabase
          .from("users")
          .select("id, username, avatar")
          .eq("id", otherUserId)
          .single();
        
        enrichedMatches.push({
          ...match,
          otherUser: otherUser || { id: otherUserId, username: "unknown" },
        });
      }
    }

    // Get all users for potential matches (excluding current user)
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar")
      .neq("id", userId)
      .limit(20); // Limit for performance

    let suggestedMatches: Array<{
      user: User;
      score: number;
      sharedCount: number;
    }> = [];

    if (allUsers && !usersError) {
      // Calculate matches for a few users (for suggestions)
      // For MVP, we'll just show a few users they haven't matched with yet
      const matchedUserIds = new Set(
        matches?.map((m: Match) =>
          m.user1_id === userId ? m.user2_id : m.user1_id
        ) || []
      );

      const unmatchedUsers = (allUsers as User[]).filter(
        (u: User) => !matchedUserIds.has(u.id)
      );

      // Calculate match for first 3 unmatched users
      const suggestions = [];
      for (const user of unmatchedUsers.slice(0, 3)) {
        try {
          const mashResult = await calculateMashScore(userId, user.id);
          suggestions.push({
            user,
            score: mashResult.score,
            sharedCount: mashResult.sharedCount,
          });
        } catch (error) {
          console.error(`Error calculating match for ${user.username}:`, error);
        }
      }

      // Sort by score and take top 3
      suggestedMatches = suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }

    // Get recent activity (recently added media)
    const { data: recentActivityRaw, error: activityError } = await supabase
      .from("user_media")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Enrich with media items
    let recentActivity: Array<UserMedia & { media_items: unknown }> = [];
    if (recentActivityRaw && recentActivityRaw.length > 0) {
      const mediaMap = await fetchMediaItemsForUserMedia(recentActivityRaw);
      recentActivity = recentActivityRaw.map((um: UserMedia) => ({
        ...um,
        media_items: mediaMap.get(um.media_id) || null,
      }));
    }

    if (activityError) {
      console.error("Error fetching activity:", activityError);
    }

    return NextResponse.json({
      stats: {
        media: {
          ...mediaCounts,
          averageRatings,
          ratedCounts,
        },
        integrations: sources?.length || 0,
        totalMatches: enrichedMatches.length,
      },
      recentMatches: enrichedMatches,
      suggestedMatches,
      recentActivity: recentActivity || [],
      connectedIntegrations: sources?.map((s: { source_name: string }) => s.source_name) || [],
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

