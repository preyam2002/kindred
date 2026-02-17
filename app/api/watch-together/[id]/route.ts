import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

interface Collection {
  id: string;
  [key: string]: unknown;
}

interface CollectionItem {
  id: string;
  media_type: string;
  media_id: string;
  sort_order: number;
  notes: string | null;
  anime?: { id: string; title: string; type: string; poster_url: string; genre?: string | string[] }[];
  manga?: { id: string; title: string; type: string; poster_url: string; genre?: string | string[] }[];
  book?: { id: string; title: string; type: string; poster_url: string; genre?: string | string[]; author?: string }[];
  movie?: { id: string; title: string; type: string; poster_url: string; genre?: string | string[] }[];
  music?: { id: string; title: string; type: string; poster_url: string; genre?: string | string[]; artist?: string }[];
}

interface FormattedItem {
  id: string;
  media_id: string;
  media_type: string;
  title: string | undefined;
  poster_url: string | undefined;
  author?: string;
  artist?: string;
  genre: string | string[] | undefined;
  notes: string | null;
  sort_order: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .map((item: CollectionItem) => {
        const mediaArray = item.anime || item.manga || item.book || item.movie || item.music;
        if (!mediaArray || mediaArray.length === 0) return null;
        const media = mediaArray[0];

        return {
          id: item.id,
          media_id: item.media_id,
          media_type: item.media_type,
          title: media.title,
          poster_url: media.poster_url,
          author: (media as { author?: string }).author,
          artist: (media as { artist?: string }).artist,
          genre: media.genre,
          notes: item.notes,
          sort_order: item.sort_order,
        };
      })
      .filter((item: FormattedItem | null): item is FormattedItem => item !== null);

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
