import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

// Color palette for genres
const GENRE_COLORS: Record<string, string> = {
  Action: "#FF6B6B",
  Adventure: "#4ECDC4",
  Comedy: "#FFD93D",
  Drama: "#6C5CE7",
  Fantasy: "#A29BFE",
  Horror: "#2D3436",
  Mystery: "#00B894",
  Romance: "#FD79A8",
  "Sci-Fi": "#0984E3",
  Thriller: "#E17055",
  "Slice of Life": "#74B9FF",
  Psychological: "#B2BEC3",
  Music: "#F39C12",
  Sports: "#E67E22",
  Supernatural: "#9B59B6",
};

function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's library with genre information
    const { data: libraryItems, error } = await supabase
      .from("library")
      .select(`
        rating,
        anime (genre),
        manga (genre),
        book (genre),
        movie (genre),
        music (genre)
      `)
      .eq("user_email", session.user.email);

    if (error) {
      console.error("Library error:", error);
      return NextResponse.json(
        { error: "Failed to fetch library" },
        { status: 500 }
      );
    }

    if (!libraryItems || libraryItems.length < 5) {
      return NextResponse.json(
        { error: "Not enough data to generate art" },
        { status: 400 }
      );
    }

    // Count genres
    const genreCounts: Record<string, number> = {};
    let totalRating = 0;
    let ratedCount = 0;

    libraryItems.forEach((item: any) => {
      const media = item.anime || item.manga || item.book || item.movie || item.music;
      if (media && media.genre && Array.isArray(media.genre)) {
        media.genre.forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }

      if (item.rating) {
        totalRating += item.rating;
        ratedCount++;
      }
    });

    // Sort genres by count and take top 10
    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        color: getGenreColor(name),
      }));

    if (topGenres.length === 0) {
      return NextResponse.json(
        { error: "No genres found in your library" },
        { status: 400 }
      );
    }

    // Calculate personality metrics
    const avgRating = ratedCount > 0 ? totalRating / ratedCount : 5;
    const uniqueGenres = Object.keys(genreCounts).length;

    // Determine color scheme based on top genres
    const primaryColor = topGenres[0]?.color || "#4ECDC4";
    const secondaryColor = topGenres[1]?.color || "#FFD93D";
    const tertiaryColor = topGenres[2]?.color || "#FF6B6B";

    return NextResponse.json({
      genres: topGenres,
      personality: {
        mainstream: Math.min(100, topGenres[0].count * 10), // Higher if one genre dominates
        diversity: Math.min(100, uniqueGenres * 5), // Higher with more unique genres
        enthusiasm: Math.round((avgRating / 10) * 100), // Based on average rating
      },
      patterns: {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        tertiary_color: tertiaryColor,
        shape: topGenres.length > 7 ? "complex" : "simple",
      },
    });
  } catch (error) {
    console.error("Error generating art:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
