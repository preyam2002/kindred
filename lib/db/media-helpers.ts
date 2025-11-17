// Helper functions for fetching media with polymorphic relationships

import { supabase } from "./supabase";
import type { MediaItem, UserMedia } from "@/types/database";

/**
 * Fetch media items for user_media records
 * Handles the polymorphic relationship between user_media and media tables
 */
export async function fetchMediaItemsForUserMedia(
  userMediaRecords: UserMedia[]
): Promise<Map<string, MediaItem>> {
  const mediaMap = new Map<string, MediaItem>();

  if (!userMediaRecords || userMediaRecords.length === 0) {
    return mediaMap;
  }

  // Group by media_type for efficient querying
  const mediaByType = {
    book: [] as string[],
    anime: [] as string[],
    manga: [] as string[],
    movie: [] as string[],
    music: [] as string[],
  };

  userMediaRecords.forEach((um) => {
    if (um.media_type && um.media_id) {
      mediaByType[um.media_type]?.push(um.media_id);
    }
  });

  // Fetch from each table in parallel
  const [books, anime, manga, movies, music] = await Promise.all([
    mediaByType.book.length > 0
      ? supabase.from("books").select("*").in("id", mediaByType.book)
      : { data: [], error: null },
    mediaByType.anime.length > 0
      ? supabase.from("anime").select("*").in("id", mediaByType.anime)
      : { data: [], error: null },
    mediaByType.manga.length > 0
      ? supabase.from("manga").select("*").in("id", mediaByType.manga)
      : { data: [], error: null },
    mediaByType.movie.length > 0
      ? supabase.from("movies").select("*").in("id", mediaByType.movie)
      : { data: [], error: null },
    mediaByType.music.length > 0
      ? supabase.from("music").select("*").in("id", mediaByType.music)
      : { data: [], error: null },
  ]);

  // Map books
  if (books.data) {
    books.data.forEach((item: any) => {
      mediaMap.set(item.id, { ...item, type: "book" } as MediaItem);
    });
  }

  // Map anime
  if (anime.data) {
    anime.data.forEach((item: any) => {
      mediaMap.set(item.id, { ...item, type: "anime" } as MediaItem);
    });
  }

  // Map manga
  if (manga.data) {
    manga.data.forEach((item: any) => {
      mediaMap.set(item.id, { ...item, type: "manga" } as MediaItem);
    });
  }

  // Map movies
  if (movies.data) {
    movies.data.forEach((item: any) => {
      mediaMap.set(item.id, { ...item, type: "movie" } as MediaItem);
    });
  }

  // Map music
  if (music.data) {
    music.data.forEach((item: any) => {
      mediaMap.set(item.id, { ...item, type: "music" } as MediaItem);
    });
  }

  return mediaMap;
}

/**
 * Fetch user media with enriched media items
 */
export async function fetchUserMediaWithItems(
  userId: string
): Promise<Array<UserMedia & { media_items: MediaItem | null }>> {
  const { data: userMedia, error } = await supabase
    .from("user_media")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (error || !userMedia) {
    return [];
  }

  const mediaMap = await fetchMediaItemsForUserMedia(userMedia);

  return userMedia.map((um) => ({
    ...um,
    media_items: mediaMap.get(um.media_id) || null,
  }));
}






