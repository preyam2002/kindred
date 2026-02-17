import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchUserMediaWithItems } from "@/lib/db/media-helpers";
import type { User } from "@/types/database";

interface UserMediaItem {
  media_type: string;
  media_id: string;
  rating?: number | null;
  media_items?: {
    title?: string;
    genre?: string[];
  } | null;
}

interface CompatibilityResult {
  overall_score: number;
  genre_overlap_score: number;
  rating_correlation: number;
  shared_items_count: number;
  anime_compatibility: number;
  manga_compatibility: number;
  book_compatibility: number;
  movie_compatibility: number;
  music_compatibility: number;
}

interface TasteHighlight {
  shared_genres: string[];
  similar_favorites: Array<{
    title: string;
    type: string;
    both_rating: number;
  }>;
}

interface Candidate {
  user: User;
  compatibility: CompatibilityResult;
  taste_highlights: TasteHighlight;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current user's library
    const currentUserMedia = await fetchUserMediaWithItems(userId);

    if (!currentUserMedia || currentUserMedia.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Get all other users who have media in their library
    const { data: otherUsers, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar, bio")
      .neq("id", userId);

    if (usersError || !otherUsers) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ candidates: [] });
    }

    // Calculate compatibility with each user
    const candidates: Candidate[] = [];

    for (const otherUser of otherUsers) {
      const otherUserMedia = await fetchUserMediaWithItems(otherUser.id);

      if (!otherUserMedia || otherUserMedia.length === 0) continue;

      // Calculate compatibility scores
      const compatibility = calculateCompatibility(
        currentUserMedia,
        otherUserMedia
      );

      // Get taste highlights
      const taste_highlights = getTasteHighlights(
        currentUserMedia,
        otherUserMedia
      );

      candidates.push({
        user: otherUser as User,
        compatibility,
        taste_highlights,
      });
    }

    // Sort by overall compatibility score (highest first)
    candidates.sort((a, b) => b.compatibility.overall_score - a.compatibility.overall_score);

    // Return top 50 candidates
    return NextResponse.json({ candidates: candidates.slice(0, 50) });
  } catch (error) {
    console.error("Error fetching taste match candidates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Calculate compatibility between two users' media libraries
function calculateCompatibility(
  user1Media: UserMediaItem[],
  user2Media: UserMediaItem[]
): CompatibilityResult {
  // Find shared items (same media_type and media_id)
  const user1Map = new Map(
    user1Media.map((item) => [`${item.media_type}:${item.media_id}`, item])
  );
  const user2Map = new Map(
    user2Media.map((item) => [`${item.media_type}:${item.media_id}`, item])
  );

  const sharedItems: Array<{ user1: UserMediaItem; user2: UserMediaItem }> = [];
  for (const [key, user1Item] of user1Map.entries()) {
    const user2Item = user2Map.get(key);
    if (user2Item) {
      sharedItems.push({ user1: user1Item, user2: user2Item });
    }
  }

  const shared_items_count = sharedItems.length;

  // Calculate rating correlation for shared items
  let rating_correlation = 0;
  if (sharedItems.length > 0) {
    const ratedShared = sharedItems.filter(
      (pair) => pair.user1.rating && pair.user2.rating
    );
    if (ratedShared.length > 0) {
      const diffs = ratedShared.map((pair) =>
        Math.abs((pair.user1.rating || 0) - (pair.user2.rating || 0))
      );
      const avgDiff = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
      // Convert to 0-1 scale (10 = max difference, 0 = perfect match)
      rating_correlation = Math.max(0, 1 - avgDiff / 10);
    }
  }

  // Calculate genre overlap
  const user1Genres = new Set<string>();
  const user2Genres = new Set<string>();

  user1Media.forEach((item) => {
    (item.media_items?.genre || []).forEach((g) => user1Genres.add(g));
  });
  user2Media.forEach((item) => {
    (item.media_items?.genre || []).forEach((g) => user2Genres.add(g));
  });

  const sharedGenres = new Set(
    [...user1Genres].filter((g) => user2Genres.has(g))
  );
  const totalUniqueGenres = new Set([...user1Genres, ...user2Genres]).size;
  const genre_overlap_score =
    totalUniqueGenres > 0 ? sharedGenres.size / totalUniqueGenres : 0;

  // Calculate per-media-type compatibility
  const mediaTypes = ["anime", "manga", "book", "movie", "music"];
  const mediaTypeScores: Record<string, number> = {};

  for (const mediaType of mediaTypes) {
    const user1TypeMedia = user1Media.filter((m) => m.media_type === mediaType);
    const user2TypeMedia = user2Media.filter((m) => m.media_type === mediaType);

    if (user1TypeMedia.length === 0 || user2TypeMedia.length === 0) {
      mediaTypeScores[mediaType] = 0;
      continue;
    }

    const typeShared = sharedItems.filter(
      (pair) => pair.user1.media_type === mediaType
    );

    // Simple overlap calculation
    const overlapRatio =
      Math.min(user1TypeMedia.length, user2TypeMedia.length) > 0
        ? typeShared.length /
          Math.min(user1TypeMedia.length, user2TypeMedia.length)
        : 0;

    mediaTypeScores[mediaType] = Math.min(100, overlapRatio * 100);
  }

  // Calculate overall score (weighted)
  const overall_score = Math.min(
    100,
    shared_items_count * 2 + // Shared items contribute heavily
      genre_overlap_score * 30 + // Genre overlap is important
      rating_correlation * 30 + // Rating similarity matters
      (mediaTypeScores.anime || 0) * 0.1 +
      (mediaTypeScores.manga || 0) * 0.1 +
      (mediaTypeScores.book || 0) * 0.1 +
      (mediaTypeScores.movie || 0) * 0.1 +
      (mediaTypeScores.music || 0) * 0.1
  );

  return {
    overall_score,
    genre_overlap_score: genre_overlap_score * 100,
    rating_correlation,
    shared_items_count,
    anime_compatibility: mediaTypeScores.anime || 0,
    manga_compatibility: mediaTypeScores.manga || 0,
    book_compatibility: mediaTypeScores.book || 0,
    movie_compatibility: mediaTypeScores.movie || 0,
    music_compatibility: mediaTypeScores.music || 0,
  };
}

// Get taste highlights (shared genres and similar favorites)
function getTasteHighlights(
  user1Media: UserMediaItem[],
  user2Media: UserMediaItem[]
): TasteHighlight {
  // Get shared genres
  const user1Genres = new Set<string>();
  const user2Genres = new Set<string>();

  user1Media.forEach((item) => {
    (item.media_items?.genre || []).forEach((g) => user1Genres.add(g));
  });
  user2Media.forEach((item) => {
    (item.media_items?.genre || []).forEach((g) => user2Genres.add(g));
  });

  const shared_genres = [...user1Genres].filter((g) => user2Genres.has(g));

  // Get similar favorites (highly rated shared items)
  const user1Map = new Map(
    user1Media
      .filter((item) => item.rating && item.rating >= 8)
      .map((item) => [`${item.media_type}:${item.media_id}`, item])
  );

  const similar_favorites: Array<{
    title: string;
    type: string;
    both_rating: number;
  }> = [];

  user2Media.forEach((item) => {
    if (!item.rating || item.rating < 8) return;

    const key = `${item.media_type}:${item.media_id}`;
    const user1Item = user1Map.get(key);

    if (user1Item) {
      similar_favorites.push({
        title: item.media_items?.title || "Unknown",
        type: item.media_type,
        both_rating: ((user1Item.rating || 0) + (item.rating || 0)) / 2,
      });
    }
  });

  // Sort by average rating
  similar_favorites.sort((a, b) => b.both_rating - a.both_rating);

  return {
    shared_genres: shared_genres.slice(0, 10),
    similar_favorites: similar_favorites.slice(0, 5),
  };
}
