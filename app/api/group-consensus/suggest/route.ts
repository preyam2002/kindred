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
    const searchParams = request.nextUrl.searchParams;
    const mediaTypesParam = searchParams.getAll("mediaTypes");
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const mediaTypes =
      mediaTypesParam.length > 0 && mediaTypesParam[0] !== "all"
        ? mediaTypesParam
        : ["anime", "manga", "book", "movie", "music"];

    // Get user's library to understand preferences
    const userMedia = await fetchUserMediaWithItems(userId);

    if (!userMedia || userMedia.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Get user's favorite genres and highly-rated items
    const userGenres: Record<string, number> = {};
    const highlyRated = userMedia.filter((item) => item.rating && item.rating >= 8);

    userMedia.forEach((item) => {
      (item.media_items?.genre || []).forEach((genre: string) => {
        userGenres[genre] = (userGenres[genre] || 0) + 1;
      });
    });

    // Get top genres
    const topGenres = Object.entries(userGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre]) => genre);

    // Get existing media IDs to exclude
    const existingMediaIds = new Set(
      userMedia.map((item) => `${item.media_type}:${item.media_id}`)
    );

    const candidates: Array<{
      id: string;
      media: {
        title: string;
        type: string;
        poster_url?: string;
        genre: string[];
      };
      votes: number;
      predicted_rating: number;
      _score: number;
    }> = [];

    // Fetch potential candidates from each media type
    for (const mediaType of mediaTypes) {
      const tableName =
        mediaType === "anime"
          ? "anime"
          : mediaType === "manga"
          ? "manga"
          : mediaType === "book"
          ? "books"
          : mediaType === "movie"
          ? "movies"
          : "music";

      const { data: items, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(50);

      if (error || !items) continue;

      // Score each item
      for (const item of items) {
        const itemKey = `${mediaType}:${item.id}`;

        // Skip if already in library
        if (existingMediaIds.has(itemKey)) continue;

        const itemGenres = item.genre || [];

        // Calculate genre match score
        const matchingGenres = itemGenres.filter((g: string) => topGenres.includes(g));
        const genreScore = matchingGenres.length > 0 ? (matchingGenres.length / topGenres.length) * 10 : 0;

        if (genreScore === 0) continue;

        // Predict rating based on genre overlap and user's average rating
        const avgRating =
          highlyRated.length > 0
            ? highlyRated.reduce((sum, item) => sum + (item.rating || 0), 0) / highlyRated.length
            : 7;

        const predictedRating = Math.min(
          10,
          avgRating * (1 + genreScore / 20)
        );

        candidates.push({
          id: item.id,
          media: {
            title: item.title,
            type: mediaType,
            poster_url: item.poster_url,
            genre: itemGenres,
          },
          votes: 0,
          predicted_rating: predictedRating,
          _score: genreScore,
        });
      }
    }

    // Sort by score and limit
    candidates.sort((a, b) => b._score - a._score);
    const finalCandidates = candidates.slice(0, limit).map(({ _score, ...rest }) => rest);

    return NextResponse.json({ candidates: finalCandidates });
  } catch (error) {
    console.error("Error generating group consensus suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
