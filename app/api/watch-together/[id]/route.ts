import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from("cross_media_collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    // Get collection items with media details
    const { data: items, error: itemsError } = await supabase
      .from("collection_items")
      .select(`
        id,
        media_type,
        media_id,
        sort_order,
        notes,
        anime (id, title, type, poster_url, genre),
        manga (id, title, type, poster_url, genre),
        book (id, title, type, poster_url, genre, author),
        movie (id, title, type, poster_url, genre),
        music (id, title, type, poster_url, genre, artist)
      `)
      .eq("collection_id", id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }

    // Format items
    const formattedItems = (items || [])
      .map((item: any) => {
        const media = item.anime || item.manga || item.book || item.movie || item.music;
        if (!media) return null;

        return {
          id: item.id,
          media_id: item.media_id,
          media_type: item.media_type,
          title: media.title,
          poster_url: media.poster_url,
          author: media.author,
          artist: media.artist,
          genre: media.genre,
          notes: item.notes,
          sort_order: item.sort_order,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      ...collection,
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
