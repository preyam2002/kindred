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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const typeFilter = searchParams.get("type") || "all";
    const crossMediaOnly = searchParams.get("cross_media") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Fetch user's media library
    const userMedia = await fetchUserMediaWithItems(userId);

    if (!userMedia || userMedia.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Get user's favorite items (rated >= 8)
    const favoriteItems = userMedia.filter(
      (item) => item.rating && item.rating >= 8
    );

    if (favoriteItems.length === 0) {
      // Fall back to all rated items
      favoriteItems.push(...userMedia.filter((item) => item.rating && item.rating > 0));
    }

    // Collect genres from favorites
    const favoriteGenres: Record<string, number> = {};
    favoriteItems.forEach((item) => {
      (item.media_items?.genre || []).forEach((genre: string) => {
        favoriteGenres[genre] = (favoriteGenres[genre] || 0) + 1;
      });
    });

    // Get top genres
    const topGenres = Object.entries(favoriteGenres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre]) => genre);

    // Get user's existing media IDs to exclude from recommendations
    const existingMediaIds = new Set(
      userMedia.map((item) => `${item.media_type}:${item.media_id}`)
    );

    // Fetch potential recommendations from each media type
    const recommendations: any[] = [];

    const mediaTypes = ["anime", "manga", "book", "movie", "music"];

    for (const mediaType of mediaTypes) {
      if (typeFilter !== "all" && typeFilter !== mediaType) continue;

      // Get the appropriate table name
      const tableName = mediaType === "anime" ? "anime" :
                        mediaType === "manga" ? "manga" :
                        mediaType === "book" ? "books" :
                        mediaType === "movie" ? "movies" : "music";

      // Fetch items from this media type
      const { data: items, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(100);

      if (error || !items) continue;

      // Score each item based on genre overlap
      for (const item of items) {
        const itemKey = `${mediaType}:${item.id}`;

        // Skip if user already has this item
        if (existingMediaIds.has(itemKey)) continue;

        const itemGenres = item.genre || [];

        // Calculate genre overlap score
        const matchingGenres = itemGenres.filter((g: string) => topGenres.includes(g));
        const genreScore = matchingGenres.length > 0 ? (matchingGenres.length / topGenres.length) * 100 : 0;

        if (genreScore === 0) continue;

        // Find which favorite item this is most similar to
        let bestMatch: any = null;
        let bestMatchScore = 0;

        favoriteItems.forEach((fav) => {
          const favGenres = fav.media_items?.genre || [];
          const overlap = itemGenres.filter((g: string) => favGenres.includes(g)).length;
          const score = overlap > 0 ? (overlap / Math.max(favGenres.length, itemGenres.length)) * 100 : 0;

          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatch = fav;
          }
        });

        // Determine if this is cross-media
        const isCrossMedia = bestMatch && bestMatch.media_type !== mediaType;

        // Skip if we only want cross-media and this isn't
        if (crossMediaOnly && !isCrossMedia) continue;

        // Generate reason
        let reason = "";
        if (matchingGenres.length > 0) {
          reason = `Matches your taste in ${matchingGenres.slice(0, 2).join(", ")}`;
        }

        recommendations.push({
          recommended_item: {
            id: item.id,
            title: item.title,
            type: mediaType,
            poster_url: item.poster_url,
            genre: itemGenres,
            author: item.author || undefined,
            artist: item.artist || undefined,
          },
          reason,
          score: genreScore,
          based_on: bestMatch ? {
            title: bestMatch.media_items?.title || "your favorites",
            type: bestMatch.media_type,
          } : null,
          cross_media: isCrossMedia,
        });
      }
    }

    // Sort by score (highest first) and limit
    recommendations.sort((a, b) => b.score - a.score);
    const finalRecommendations = recommendations.slice(0, limit);

    return NextResponse.json({ recommendations: finalRecommendations });
  } catch (error) {
    console.error("Error generating universal recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
