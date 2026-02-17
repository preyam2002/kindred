import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchUserMediaWithItems } from "@/lib/db/media-helpers";

interface MoodRecommendation {
  media: {
    id: string;
    title: string;
    type: string;
    poster_url?: string;
    genre?: string[];
    author?: string;
    artist?: string;
  };
  reason: string;
  moodMatch: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const selectedMoods = searchParams.getAll("moods");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (selectedMoods.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Get user's library to understand preferences
    const userMedia = await fetchUserMediaWithItems(userId);

    if (!userMedia || userMedia.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Map moods to genres (simple heuristic mapping)
    const moodToGenresMap: Record<string, string[]> = {
      happy: ["Comedy", "Romance", "Slice of Life", "Music"],
      sad: ["Drama", "Romance", "Tragedy"],
      energetic: ["Action", "Sports", "Adventure", "Shounen"],
      relaxing: ["Slice of Life", "Iyashikei", "Music", "Nature"],
      "thought-provoking": ["Psychological", "Mystery", "Philosophy", "Sci-Fi"],
      escapist: ["Fantasy", "Isekai", "Adventure", "Magic"],
      inspiring: ["Sports", "Drama", "Biography", "Music"],
      nostalgic: ["Classic", "Coming of Age", "Historical"],
      thrilling: ["Thriller", "Mystery", "Horror", "Suspense"],
      cozy: ["Slice of Life", "Romance", "Comedy", "Cooking"],
      dark: ["Horror", "Psychological", "Thriller", "Seinen"],
      lighthearted: ["Comedy", "Slice of Life", "Kids", "Family"],
      romantic: ["Romance", "Shoujo", "Drama"],
      adventurous: ["Adventure", "Action", "Fantasy", "Sci-Fi"],
      mysterious: ["Mystery", "Detective", "Thriller", "Supernatural"],
    };

    // Collect target genres based on selected moods
    const targetGenres = new Set<string>();
    selectedMoods.forEach((mood) => {
      const genres = moodToGenresMap[mood] || [];
      genres.forEach((g) => targetGenres.add(g));
    });

    // Get user's existing media IDs to exclude
    const existingMediaIds = new Set(
      userMedia.map((item) => `${item.media_type}:${item.media_id}`)
    );

    // Get user's favorite genres
    const userGenres: Record<string, number> = {};
    userMedia.forEach((item) => {
      (item.media_items?.genre || []).forEach((genre: string) => {
        userGenres[genre] = (userGenres[genre] || 0) + 1;
      });
    });

    const recommendations: MoodRecommendation[] = [];
    const mediaTypes = ["anime", "manga", "book", "movie", "music"];

    // Fetch potential recommendations from each media type
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
        .limit(100);

      if (error || !items) continue;

      // Score each item based on mood-genre matching
      for (const item of items) {
        const itemKey = `${mediaType}:${item.id}`;

        // Skip if user already has this item
        if (existingMediaIds.has(itemKey)) continue;

        const itemGenres = item.genre || [];

        // Calculate mood match score
        const moodMatchingGenres = itemGenres.filter((g: string) =>
          targetGenres.has(g)
        );
        const moodMatchScore =
          targetGenres.size > 0
            ? (moodMatchingGenres.length / targetGenres.size) * 100
            : 0;

        if (moodMatchScore === 0) continue;

        // Bonus for genres user already likes
        const userFavoriteGenres = itemGenres.filter(
          (g: string) => userGenres[g]
        );
        const userPreferenceBonus = userFavoriteGenres.length * 10;

        const finalScore = Math.min(100, moodMatchScore + userPreferenceBonus);

        // Generate reason
        let reason = "";
        if (moodMatchingGenres.length > 0) {
          reason = `Perfect for ${selectedMoods[0].replace(/-/g, " ")} mood`;
        }

        recommendations.push({
          media: {
            id: item.id,
            title: item.title,
            type: mediaType,
            poster_url: item.poster_url,
            genre: itemGenres,
            author: item.author || undefined,
            artist: item.artist || undefined,
          },
          reason,
          moodMatch: Math.round(finalScore),
        });
      }
    }

    // Sort by mood match score and limit
    recommendations.sort((a, b) => b.moodMatch - a.moodMatch);
    const finalRecommendations = recommendations.slice(0, limit);

    return NextResponse.json({ recommendations: finalRecommendations });
  } catch (error) {
    console.error("Error generating mood recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
