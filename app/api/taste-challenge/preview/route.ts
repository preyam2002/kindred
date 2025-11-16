import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

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
      .map((item: any) => {
        const media = item.anime || item.manga || item.book || item.movie || item.music;
        if (!media) return null;

        return {
          id: item.media_id,
          title: media.title,
          type: media.type,
          poster_url: media.poster_url,
          rating: item.rating,
          author: media.author,
          artist: media.artist,
        };
      })
      .filter(Boolean)
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
