import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

interface RouletteRecommendation {
  id: string;
  title: string;
  genre?: string[];
  poster_url?: string;
  [key: string]: unknown;
}

interface TasteProfile {
  top_genres?: string[];
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's taste profile for personalization
    const { data: tasteProfile } = await supabase
      .from("taste_profiles")
      .select("*")
      .eq("user_email", session.user.email)
      .single();

    // Get user's existing library to avoid recommending what they have
    const { data: existingLibrary } = await supabase
      .from("library")
      .select("media_id")
      .eq("user_email", session.user.email);

    const existingMediaIds = new Set(
      existingLibrary?.map((item) => item.media_id) || []
    );

    const topGenres = tasteProfile?.top_genres || [];
    const mediaTypes = ["anime", "manga", "book", "movie", "music"];

    // Randomly select a media type
    const randomType = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];

    let recommendations: RouletteRecommendation[] = [];

    // Get recommendations based on user's top genres
    if (topGenres.length > 0) {
      const randomGenre = topGenres[Math.floor(Math.random() * topGenres.length)];

      const { data: genreMatches } = await supabase
        .from(randomType)
        .select("*")
        .contains("genre", [randomGenre])
        .limit(50);

      if (genreMatches && genreMatches.length > 0) {
        // Filter out items already in library
        const filtered = genreMatches.filter(
          (item) => !existingMediaIds.has(item.id)
        );

        if (filtered.length > 0) {
          recommendations = filtered;
        }
      }
    }

    // Fallback: get random items if no genre matches
    if (recommendations.length === 0) {
      const { data: randomItems } = await supabase
        .from(randomType)
        .select("*")
        .limit(100);

      if (randomItems) {
        recommendations = randomItems.filter(
          (item) => !existingMediaIds.has(item.id)
        );
      }
    }

    // Randomly select 5 recommendations
    const shuffled = recommendations.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map((item) => ({
      ...item,
      media_type: randomType,
    }));

    return NextResponse.json({
      recommendations: selected,
      genre_used: topGenres.length > 0 ? topGenres[Math.floor(Math.random() * topGenres.length)] : null,
      media_type: randomType,
    });
  } catch (error) {
    console.error("Error spinning roulette:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
