// Recommendations engine for suggesting media to users
import { supabase } from "./db/supabase";
import type { MediaItem } from "@/types/database";

export interface Recommendation {
  media: MediaItem;
  reason: string;
  score: number;
  source: "collaborative" | "content" | "similar_users";
}

/**
 * Get collaborative filtering recommendations
 * "Users like you also liked" algorithm
 */
export async function getCollaborativeRecommendations(
  userId: string,
  limit: number = 10
): Promise<Recommendation[]> {
  // Get user's media items
  const { data: userMedia } = await supabase
    .from("user_media")
    .select("media_item_id, rating")
    .eq("user_id", userId);

  if (!userMedia || userMedia.length === 0) {
    return [];
  }

  const userMediaIds = new Set(userMedia.map((um) => um.media_item_id));

  // Find users with similar tastes (have at least 3 shared items with high ratings)
  const { data: allUserMedia } = await supabase
    .from("user_media")
    .select("user_id, media_item_id, rating")
    .neq("user_id", userId)
    .in("media_item_id", Array.from(userMediaIds));

  if (!allUserMedia) {
    return [];
  }

  // Count shared items per user and find similar users
  const userSharedCounts = new Map<string, number>();
  const userSharedRatings = new Map<string, Map<string, number>>();

  allUserMedia.forEach((um) => {
    if (userMediaIds.has(um.media_item_id)) {
      const count = userSharedCounts.get(um.user_id) || 0;
      userSharedCounts.set(um.user_id, count + 1);

      if (!userSharedRatings.has(um.user_id)) {
        userSharedRatings.set(um.user_id, new Map());
      }
      userSharedRatings.get(um.user_id)!.set(um.media_item_id, um.rating || 0);
    }
  });

  // Find users with at least 3 shared items
  const similarUserIds = Array.from(userSharedCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([userId]) => userId);

  if (similarUserIds.length === 0) {
    return [];
  }

  // Get items liked by similar users that the current user doesn't have
  const { data: similarUserMedia } = await supabase
    .from("user_media")
    .select("media_item_id, rating, media_items(*)")
    .in("user_id", similarUserIds)
    .gte("rating", 7) // Only highly rated items
    .not("media_item_id", "in", `(${Array.from(userMediaIds).join(",")})`);

  if (!similarUserMedia) {
    return [];
  }

  // Score items based on how many similar users liked them and their ratings
  const itemScores = new Map<string, { count: number; totalRating: number }>();

  similarUserMedia.forEach((um: any) => {
    const mediaId = um.media_item_id;
    const rating = um.rating || 0;

    if (!itemScores.has(mediaId)) {
      itemScores.set(mediaId, { count: 0, totalRating: 0 });
    }

    const score = itemScores.get(mediaId)!;
    score.count += 1;
    score.totalRating += rating;
  });

  // Convert to recommendations
  const recommendations: Recommendation[] = [];

  for (const [mediaId, score] of itemScores.entries()) {
    const avgRating = score.totalRating / score.count;
    const finalScore = score.count * 0.6 + avgRating * 0.4; // Weight by popularity and rating

    const found = similarUserMedia.find(
      (um: any) => um.media_item_id === mediaId
    );
    const mediaItem = found?.media_items;

    if (mediaItem && found) {
      recommendations.push({
        media: mediaItem as unknown as MediaItem,
        reason: `Liked by ${score.count} user${score.count > 1 ? "s" : ""} with similar taste`,
        score: finalScore,
        source: "collaborative",
      });
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get content-based recommendations
 * Based on genres/types user has liked
 */
export async function getContentBasedRecommendations(
  userId: string,
  limit: number = 10
): Promise<Recommendation[]> {
  // Get user's highly rated media
  const { data: userMedia } = await supabase
    .from("user_media")
    .select("media_item_id, rating, media_items(*)")
    .eq("user_id", userId)
    .gte("rating", 7);

  if (!userMedia || userMedia.length === 0) {
    return [];
  }

  // Extract genres and types user likes
  const likedGenres = new Set<string>();
  const likedTypes = new Set<string>();

  userMedia.forEach((um: any) => {
    const media = um.media_items;
    if (media?.genre) {
      media.genre.forEach((g: string) => likedGenres.add(g));
    }
    if (media?.type) {
      likedTypes.add(media.type);
    }
  });

  if (likedGenres.size === 0 && likedTypes.size === 0) {
    return [];
  }

  const userMediaIds = new Set(userMedia.map((um) => um.media_item_id));

  // Find media with similar genres/types that user hasn't rated
  let recommendationsQuery = supabase
    .from("media_items")
    .select("*")
    .not("id", "in", `(${Array.from(userMediaIds).join(",")})`)
    .limit(100);

  // Filter by type if we have types
  if (likedTypes.size > 0) {
    recommendationsQuery = recommendationsQuery.in(
      "type",
      Array.from(likedTypes)
    );
  }

  const { data: candidateMedia } = await recommendationsQuery;

  if (!candidateMedia) {
    return [];
  }

  // Score items based on genre overlap
  const scoredItems = candidateMedia.map((media: any) => {
    const mediaGenres = new Set(media.genre || []);
    const sharedGenres = Array.from(likedGenres).filter((g) =>
      mediaGenres.has(g)
    );
    const genreScore = sharedGenres.length / Math.max(likedGenres.size, 1);

    return {
      media: media as MediaItem,
      score: genreScore,
      reason: `Similar to your favorite ${sharedGenres.slice(0, 2).join(", ")}`,
      source: "content" as const,
    };
  });

  return scoredItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      reason: item.score > 0.5 ? item.reason : "Based on your preferences",
    }));
}

/**
 * Get recommendations from users with high similarity scores
 */
export async function getSimilarUserRecommendations(
  userId: string,
  limit: number = 10
): Promise<Recommendation[]> {
  // Get top matches
  const { data: matches } = await supabase
    .from("matches")
    .select("user1_id, user2_id, similarity_score")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .gte("similarity_score", 70) // Only high similarity matches
    .order("similarity_score", { ascending: false })
    .limit(5);

  if (!matches || matches.length === 0) {
    return [];
  }

  const similarUserIds = matches.map((m) =>
    m.user1_id === userId ? m.user2_id : m.user1_id
  );

  // Get user's media to exclude
  const { data: userMedia } = await supabase
    .from("user_media")
    .select("media_item_id")
    .eq("user_id", userId);

  const userMediaIds = new Set(userMedia?.map((um) => um.media_item_id) || []);

  // Get highly rated media from similar users
  const { data: similarUserMedia } = await supabase
    .from("user_media")
    .select("media_item_id, rating, media_items(*)")
    .in("user_id", similarUserIds)
    .gte("rating", 8) // Only very highly rated
    .not("media_item_id", "in", `(${Array.from(userMediaIds).join(",")})`);

  if (!similarUserMedia) {
    return [];
  }

  // Group by media item and score
  const itemScores = new Map<string, { count: number; rating: number }>();

  similarUserMedia.forEach((um: any) => {
    const mediaId = um.media_item_id;
    if (!itemScores.has(mediaId)) {
      itemScores.set(mediaId, { count: 0, rating: 0 });
    }
    const score = itemScores.get(mediaId)!;
    score.count += 1;
    score.rating = Math.max(score.rating, um.rating || 0);
  });

  const recommendations: Recommendation[] = [];

  for (const [mediaId, score] of itemScores.entries()) {
    const found = similarUserMedia.find(
      (um: any) => um.media_item_id === mediaId
    );
    const mediaItem = found?.media_items;

    if (mediaItem && found) {
      recommendations.push({
        media: mediaItem as unknown as MediaItem,
        reason: `Liked by ${score.count} highly compatible user${score.count > 1 ? "s" : ""}`,
        score: score.count * 10 + score.rating,
        source: "similar_users",
      });
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get all recommendations for a user
 * Combines all recommendation types
 */
export async function getAllRecommendations(
  userId: string,
  limit: number = 20
): Promise<Recommendation[]> {
  const [collaborative, content, similarUsers] = await Promise.all([
    getCollaborativeRecommendations(userId, limit / 3),
    getContentBasedRecommendations(userId, limit / 3),
    getSimilarUserRecommendations(userId, limit / 3),
  ]);

  // Combine and deduplicate by media ID
  const allRecs = [...collaborative, ...content, ...similarUsers];
  const seen = new Set<string>();
  const unique: Recommendation[] = [];

  for (const rec of allRecs) {
    if (!seen.has(rec.media.id)) {
      seen.add(rec.media.id);
      unique.push(rec);
    }
  }

  // Sort by score and return top N
  return unique.sort((a, b) => b.score - a.score).slice(0, limit);
}

