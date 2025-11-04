// Matching engine for calculating similarity scores between users

import { supabase } from "./db/supabase";
import type { Match, UserMedia, MediaItem } from "@/types/database";

export interface MashScoreResult {
  score: number; // 0-100
  sharedCount: number;
  sharedItems: Array<{
    media: MediaItem;
    user1Rating?: number;
    user2Rating?: number;
  }>;
  recommendations: Array<{
    media: MediaItem;
    reason: string;
  }>;
}

/**
 * Calculate MashScore between two users
 * Factors:
 * - Overlap percentage
 * - Rating correlation
 * - Genre similarity
 */
export async function calculateMashScore(
  user1Id: string,
  user2Id: string
): Promise<MashScoreResult> {
  // Fetch all media for both users
  const { data: user1Media, error: error1 } = await supabase
    .from("user_media")
    .select("*, media_items(*)")
    .eq("user_id", user1Id);

  const { data: user2Media, error: error2 } = await supabase
    .from("user_media")
    .select("*, media_items(*)")
    .eq("user_id", user2Id);

  if (error1 || error2 || !user1Media || !user2Media) {
    throw new Error("Failed to fetch user media");
  }

  // Create maps for quick lookup
  const user1Map = new Map(
    user1Media.map((um) => [
      um.media_item_id,
      { rating: um.rating, media: um.media_items },
    ])
  );
  const user2Map = new Map(
    user2Media.map((um) => [
      um.media_item_id,
      { rating: um.rating, media: um.media_items },
    ])
  );

  // Find shared items
  const sharedItems: MashScoreResult["sharedItems"] = [];
  let ratingSum = 0;
  let ratingCount = 0;

  user1Map.forEach((user1Data, mediaId) => {
    const user2Data = user2Map.get(mediaId);
    if (user2Data && user1Data.media) {
      sharedItems.push({
        media: user1Data.media as MediaItem,
        user1Rating: user1Data.rating,
        user2Rating: user2Data.rating,
      });

      if (user1Data.rating && user2Data.rating) {
        // Calculate rating correlation
        const diff = Math.abs(user1Data.rating - user2Data.rating);
        ratingSum += 10 - diff; // Closer ratings = higher score
        ratingCount++;
      }
    }
  });

  // Calculate overlap percentage
  const totalUnique = new Set([...user1Map.keys(), ...user2Map.keys()]).size;
  const overlapPercentage = (sharedItems.length / totalUnique) * 100;

  // Calculate rating correlation score
  const ratingScore = ratingCount > 0 ? (ratingSum / ratingCount / 10) * 100 : 0;

  // Genre similarity (simplified - count shared genres)
  const user1Genres = new Set(
    Array.from(user1Map.values())
      .flatMap((d) => (d.media as MediaItem)?.genre || [])
  );
  const user2Genres = new Set(
    Array.from(user2Map.values())
      .flatMap((d) => (d.media as MediaItem)?.genre || [])
  );
  const sharedGenres = new Set(
    [...user1Genres].filter((g) => user2Genres.has(g))
  );
  const genreScore =
    user1Genres.size > 0 && user2Genres.size > 0
      ? (sharedGenres.size / Math.max(user1Genres.size, user2Genres.size)) * 100
      : 0;

  // Weighted final score
  // 50% overlap, 30% rating correlation, 20% genre similarity
  const finalScore = Math.round(
    overlapPercentage * 0.5 + ratingScore * 0.3 + genreScore * 0.2
  );

  // Generate recommendations (items user2 has that user1 doesn't)
  const recommendations: MashScoreResult["recommendations"] = [];
  user2Map.forEach((user2Data, mediaId) => {
    if (!user1Map.has(mediaId) && user2Data.media) {
      const media = user2Data.media as MediaItem;
      const rating = user2Data.rating || 0;
      if (rating >= 7) {
        recommendations.push({
          media,
          reason: `Liked by ${user2Id.slice(0, 8)}... (${rating}/10)`,
        });
      }
    }
  });

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    sharedCount: sharedItems.length,
    sharedItems,
    recommendations: recommendations.slice(0, 10), // Top 10
  };
}

/**
 * Get or calculate match between two users
 * Uses cached match if recent (within 24 hours), otherwise recalculates
 */
export async function getOrCreateMatch(
  user1Id: string,
  user2Id: string,
  forceRecalculate: boolean = false
): Promise<Match> {
  // Check if match exists
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user1Id},user1_id.eq.${user2Id}`)
    .or(`user2_id.eq.${user1Id},user2_id.eq.${user2Id}`)
    .single();

  // If match exists and not forcing recalculation, check if cache is still valid
  if (existingMatch && !forceRecalculate) {
    const matchAge = Date.now() - new Date(existingMatch.updated_at).getTime();
    const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Check if either user has updated their media recently (within last hour)
    // If so, we should recalculate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data: recentMedia1 } = await supabase
      .from("user_media")
      .select("updated_at")
      .eq("user_id", user1Id)
      .gte("updated_at", oneHourAgo.toISOString())
      .limit(1);

    const { data: recentMedia2 } = await supabase
      .from("user_media")
      .select("updated_at")
      .eq("user_id", user2Id)
      .gte("updated_at", oneHourAgo.toISOString())
      .limit(1);

    // If cache is fresh (< 24 hours) and no recent media updates, return cached
    if (matchAge < cacheMaxAge && (!recentMedia1 || recentMedia1.length === 0) && (!recentMedia2 || recentMedia2.length === 0)) {
      return existingMatch as Match;
    }
  }

  // Calculate new match (either doesn't exist, cache expired, or force recalculation)
  const mashResult = await calculateMashScore(user1Id, user2Id);

  if (existingMatch) {
    // Update existing match
    const { data: updatedMatch, error } = await supabase
      .from("matches")
      .update({
        similarity_score: mashResult.score,
        shared_count: mashResult.sharedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingMatch.id)
      .select()
      .single();

    if (error || !updatedMatch) {
      throw new Error("Failed to update match");
    }

    return updatedMatch as Match;
  } else {
    // Create new match
    const { data: newMatch, error } = await supabase
      .from("matches")
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        similarity_score: mashResult.score,
        shared_count: mashResult.sharedCount,
      })
      .select()
      .single();

    if (error || !newMatch) {
      throw new Error("Failed to create match");
    }

    return newMatch as Match;
  }
}

