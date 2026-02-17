import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

interface LibraryItem {
  id: string;
  media_id: string;
  rating: number | null;
  anime?: { id: string; title: string; type: string; poster_url: string }[];
  manga?: { id: string; title: string; type: string; poster_url: string }[];
  book?: { id: string; title: string; type: string; poster_url: string; author: string }[];
  movie?: { id: string; title: string; type: string; poster_url: string }[];
  music?: { id: string; title: string; type: string; poster_url: string; artist: string }[];
}

interface ChallengeItem {
  id: string;
  title: string;
  type: string;
  poster_url: string;
  rating: number;
  author?: string;
  artist?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's highly rated items from library
    const { data: libraryItems, error: libraryError } = await supabase
      .from("library")
      .select(`
        id,
        media_id,
        rating,
        anime (id, title, type, poster_url),
        manga (id, title, type, poster_url),
        book (id, title, type, poster_url, author),
        movie (id, title, type, poster_url),
        music (id, title, type, poster_url, artist)
      `)
      .eq("user_email", session.user.email)
      .gte("rating", 7)
      .order("rating", { ascending: false })
      .limit(20);

    if (libraryError) {
      console.error("Library error:", libraryError);
      return NextResponse.json(
        { error: "Failed to fetch library" },
        { status: 500 }
      );
    }

    if (!libraryItems || libraryItems.length === 0) {
      return NextResponse.json(
        { error: "You need to rate at least some items in your library first" },
        { status: 400 }
      );
    }

    // Format items for preview
    const items = libraryItems
      .map((item: LibraryItem) => {
        const mediaArray = item.anime || item.manga || item.book || item.movie || item.music;
        if (!mediaArray || mediaArray.length === 0) return null;
        const media = mediaArray[0];

        return {
          id: item.media_id,
          title: media.title,
          type: media.type,
          poster_url: media.poster_url,
          rating: item.rating ?? 0,
          author: (media as { author?: string }).author,
          artist: (media as { artist?: string }).artist,
        };
      })
      .filter((item: ChallengeItem | null): item is ChallengeItem => item !== null)
      .slice(0, 15); // Top 15 items

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No valid items found in your library" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
