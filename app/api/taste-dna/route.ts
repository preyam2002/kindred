import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchUserMediaWithItems } from "@/lib/db/media-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's complete media library with items
    const media = await fetchUserMediaWithItems(userId);

    if (!media || media.length === 0) {
      return NextResponse.json(null);
    }

    // Filter out items without ratings for some calculations
    const ratedItems = media.filter((item) => item.rating && item.rating > 0);

    // Calculate total items count
    const totalItemsCount = media.length;

    // Calculate media type distribution
    const mediaTypeDistribution: Record<string, number> = {};
    media.forEach((item) => {
      const type = item.media_type;
      mediaTypeDistribution[type] = (mediaTypeDistribution[type] || 0) + 1;
    });

    // Find most active media type
    const mostActiveMediaType = Object.entries(mediaTypeDistribution).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || "anime";

    // Calculate top genres by media type and overall
    const genreCountByType: Record<string, Record<string, number>> = {};
    const genreCountOverall: Record<string, number> = {};

    media.forEach((item) => {
      const mediaType = item.media_type;
      const genres = item.media_items?.genre || [];

      if (!genreCountByType[mediaType]) {
        genreCountByType[mediaType] = {};
      }

      genres.forEach((genre: string) => {
        // By type
        genreCountByType[mediaType][genre] =
          (genreCountByType[mediaType][genre] || 0) + 1;

        // Overall
        genreCountOverall[genre] = (genreCountOverall[genre] || 0) + 1;
      });
    });

    // Get top 10 genres per media type
    const topGenres: Record<string, string[]> = {};
    Object.entries(genreCountByType).forEach(([mediaType, genreCounts]) => {
      topGenres[mediaType] = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([genre]) => genre);
    });

    // Get top 10 genres overall
    const favoriteGenresOverall = Object.entries(genreCountOverall)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre]) => genre);

    // Calculate average rating
    const avgRating =
      ratedItems.length > 0
        ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length
        : 0;

    // Calculate rating distribution (group into ranges)
    const ratingDistribution: Record<string, number> = {
      "1-2": 0,
      "3-4": 0,
      "5-6": 0,
      "7-8": 0,
      "9-10": 0,
    };

    ratedItems.forEach((item) => {
      const rating = item.rating || 0;
      if (rating >= 1 && rating <= 2) ratingDistribution["1-2"]++;
      else if (rating >= 3 && rating <= 4) ratingDistribution["3-4"]++;
      else if (rating >= 5 && rating <= 6) ratingDistribution["5-6"]++;
      else if (rating >= 7 && rating <= 8) ratingDistribution["7-8"]++;
      else if (rating >= 9 && rating <= 10) ratingDistribution["9-10"]++;
    });

    // Calculate temporal metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const itemsAddedLast30Days = media.filter((item) => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= thirtyDaysAgo;
    }).length;

    // Calculate taste characteristics (0-10 scores)

    // 1. Genre Diversity Score
    // Based on how many unique genres across all media
    const uniqueGenresCount = Object.keys(genreCountOverall).length;
    const maxExpectedGenres = 50; // Arbitrary max for scaling
    const genreDiversityScore = Math.min(
      10,
      (uniqueGenresCount / maxExpectedGenres) * 10
    );

    // 2. Rating Generosity Score
    // Based on average rating (higher avg = more generous)
    const ratingGenerosityScore = avgRating;

    // 3. Activity Score
    // Based on items added in last 30 days relative to total
    const activityRatio =
      totalItemsCount > 0 ? itemsAddedLast30Days / totalItemsCount : 0;
    const activityScore = Math.min(10, activityRatio * 100);

    // Determine rating pattern
    let ratingPattern: string;
    if (avgRating >= 7.5) ratingPattern = "generous";
    else if (avgRating >= 5.5) ratingPattern = "balanced";
    else ratingPattern = "harsh";

    // Determine consumption style
    let consumptionStyle: string;

    if (activityScore >= 7 && genreDiversityScore >= 7) {
      consumptionStyle = "diverse_explorer";
    } else if (activityScore >= 7) {
      consumptionStyle = "binge_watcher";
    } else if (genreDiversityScore >= 7) {
      consumptionStyle = "diverse_explorer";
    } else if (activityScore >= 4) {
      consumptionStyle = "steady_reader";
    } else {
      consumptionStyle = "casual_enjoyer";
    }

    // Calculate average rating trend (last 6 months)
    const avgRatingTrend: Array<{ month: string; avg: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthItems = ratedItems.filter((item) => {
        const timestamp = new Date(item.timestamp);
        return timestamp >= monthStart && timestamp <= monthEnd;
      });

      const monthAvg =
        monthItems.length > 0
          ? monthItems.reduce((sum, item) => sum + (item.rating || 0), 0) / monthItems.length
          : 0;

      avgRatingTrend.push({
        month: monthDate.toISOString().slice(0, 7), // "YYYY-MM"
        avg: monthAvg,
      });
    }

    // Construct taste profile
    const tasteProfile = {
      topGenres,
      avgRating,
      ratingDistribution,
      totalItemsCount,
      mediaTypeDistribution,
      itemsAddedLast30Days,
      avgRatingTrend,
      genreDiversityScore,
      ratingGenerosityScore,
      activityScore,
      mostActiveMediaType,
      favoriteGenresOverall,
      ratingPattern,
      consumptionStyle,
    };

    return NextResponse.json(tasteProfile);
  } catch (error) {
    console.error("Error generating taste DNA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
