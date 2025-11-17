// MyAnimeList API integration utilities
// Supports both client_auth (API key only) and OAuth for accessing user-specific data like ratings
import { supabase } from "@/lib/db/supabase";
import { cachedFetch, CacheKeys } from "@/lib/cache";
import crypto from "crypto";

const MAL_API_URL = "https://api.myanimelist.net/v2";
const MAL_AUTH_URL = "https://myanimelist.net/v1/oauth2";
const MAL_CLIENT_ID = process.env.MYANIMELIST_CLIENT_ID || "";
const MAL_CLIENT_SECRET = process.env.MYANIMELIST_CLIENT_SECRET || "";

/**
 * Get user's anime list
 * Uses OAuth token if provided (for user-specific data like ratings), otherwise uses client_auth
 * Cached for 1 hour to prevent rate limiting
 */
export async function getMALAnimeList(
  username: string,
  limit: number = 100,
  offset: number = 0,
  status?: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch",
  accessToken?: string
): Promise<any> {
  const cacheKey = `${CacheKeys.malUserAnimeList(username)}:${limit}:${offset}${status ? `:${status}` : ""}${accessToken ? ":oauth" : ""}`;

  return cachedFetch(
    cacheKey,
    async () => {
      const fields = "id,title,main_picture,mean,genres,media_type,num_episodes,status,my_list_status{score,status,updated_at}";
      let url = `${MAL_API_URL}/users/${username}/animelist?fields=${fields}&limit=${limit}&offset=${offset}`;

      if (status) {
        url += `&status=${status}`;
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        headers["X-MAL-CLIENT-ID"] = MAL_CLIENT_ID;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to fetch anime list: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    },
    3600 // Cache for 1 hour
  );
}

/**
 * Get user's manga list
 * Uses OAuth token if provided (for user-specific data like ratings), otherwise uses client_auth
 * Cached for 1 hour to prevent rate limiting
 */
export async function getMALMangaList(
  username: string,
  limit: number = 100,
  offset: number = 0,
  status?: "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read",
  accessToken?: string
): Promise<any> {
  const cacheKey = `${CacheKeys.malUserMangaList(username)}:${limit}:${offset}${status ? `:${status}` : ""}${accessToken ? ":oauth" : ""}`;

  return cachedFetch(
    cacheKey,
    async () => {
      const fields = "id,title,main_picture,mean,genres,media_type,num_chapters,status,my_list_status{score,status,updated_at}";
      let url = `${MAL_API_URL}/users/${username}/mangalist?fields=${fields}&limit=${limit}&offset=${offset}`;

      if (status) {
        url += `&status=${status}`;
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        headers["X-MAL-CLIENT-ID"] = MAL_CLIENT_ID;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to fetch manga list: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    },
    3600 // Cache for 1 hour
  );
}

/**
 * Generate PKCE code challenge and verifier for OAuth
 * Required for MAL OAuth flow
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

/**
 * Get MAL OAuth authorization URL
 */
export function getMALAuthUrl(state: string, codeChallenge: string, callbackUrl: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: MAL_CLIENT_ID,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    redirect_uri: callbackUrl,
  });
  return `${MAL_AUTH_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeMALToken(
  code: string,
  codeVerifier: string,
  callbackUrl: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch(`${MAL_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: MAL_CLIENT_ID,
      client_secret: MAL_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange MAL token: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh MAL access token
 */
export async function refreshMALToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch(`${MAL_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: MAL_CLIENT_ID,
      client_secret: MAL_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh MAL token: ${error}`);
  }

  return await response.json();
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidMALAccessToken(
  userId: string
): Promise<string | null> {
  const { data: malSource, error } = await supabase
    .from("sources")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("source_name", "myanimelist")
    .single();

  if (error || !malSource) {
    return null;
  }

  // If we have a valid access token, return it
  if (malSource.access_token && malSource.expires_at) {
    const expiresAt = new Date(malSource.expires_at);
    const now = new Date();
    // Refresh if token expires in less than 5 minutes
    if (expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
      return malSource.access_token;
    }
  }

  // Token expired or missing, try to refresh
  if (malSource.refresh_token) {
    try {
      const tokens = await refreshMALToken(malSource.refresh_token);
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

      await supabase
        .from("sources")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("source_name", "myanimelist");

      return tokens.access_token;
    } catch (error) {
      console.error("Error refreshing MAL token:", error);
      return null;
    }
  }

  return null;
}

/**
 * Get MAL user profile using OAuth access token
 */
export async function getMALUserProfile(accessToken: string): Promise<{
  id: number;
  name: string;
  picture?: string;
}> {
  const response = await fetch(`${MAL_API_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch MAL user profile: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Sync user's anime and manga from MAL
 * Note: Only requires CLIENT_ID for public lists, no OAuth needed
 */
export async function syncMALData(
  userId: string
): Promise<{ animeImported: number; mangaImported: number; errors: number }> {
  // Get user's MAL username from sources
  const { data: malSource, error: sourceError } = await supabase
    .from("sources")
    .select("source_user_id")
    .eq("user_id", userId)
    .eq("source_name", "myanimelist")
    .single();

  if (sourceError || !malSource || !malSource.source_user_id) {
    console.error(`MAL source not found for user: ${userId}`, sourceError);
    throw new Error(`MAL source not found for user: ${userId}`);
  }

  const malUsername = malSource.source_user_id;
  
  // Get OAuth access token if available (for ratings)
  const accessToken = await getValidMALAccessToken(userId);

  try {
    let animeImported = 0;
    let mangaImported = 0;
    let errors = 0;

    // Collect all anime and manga items first
    const allAnimeItems: Array<{ anime: any; listStatus: any }> = [];
    const allMangaItems: Array<{ manga: any; listStatus: any }> = [];

    // Fetch anime list
    try {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const animeData = await getMALAnimeList(malUsername, limit, offset, undefined, accessToken || undefined);
        const animeList = animeData.data || [];

        for (const item of animeList) {
          if (item.node && item.node.id) {
            allAnimeItems.push({
              anime: item.node,
              listStatus: item.list_status,
            });
          }
        }

        hasMore = animeList.length === limit;
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching anime list:", error);
      errors++;
    }

    // Fetch manga list
    try {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const mangaData = await getMALMangaList(malUsername, limit, offset, undefined, accessToken || undefined);
        const mangaList = mangaData.data || [];

        for (const item of mangaList) {
          if (item.node && item.node.id) {
            allMangaItems.push({
              manga: item.node,
              listStatus: item.list_status,
            });
          }
        }

        hasMore = mangaList.length === limit;
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching manga list:", error);
      errors++;
    }

    // Process anime and manga separately
    const animeItems = allAnimeItems.map(item => ({
      id: item.anime.id.toString(),
      title: item.anime.title,
      genre: item.anime.genres?.map((g: any) => g.name) || undefined,
      poster_url: item.anime.main_picture?.medium || undefined,
      num_episodes: item.anime.num_episodes || undefined,
      listStatus: item.listStatus,
    }));

    const mangaItems = allMangaItems.map(item => ({
      id: item.manga.id.toString(),
      title: item.manga.title,
      genre: item.manga.genres?.map((g: any) => g.name) || undefined,
      poster_url: item.manga.main_picture?.medium || undefined,
      num_chapters: item.manga.num_chapters || undefined,
      listStatus: item.listStatus,
    }));

    if (animeItems.length === 0 && mangaItems.length === 0) {
      return { animeImported: 0, mangaImported: 0, errors };
    }

    // Step 1: Batch check existing anime items
    const animeIds = animeItems.map(item => item.id);
    const { data: existingAnimeItems } = animeIds.length > 0
      ? await supabase
          .from("anime")
          .select("id, source_item_id")
          .eq("source", "myanimelist")
          .in("source_item_id", animeIds)
      : { data: null };

    const existingAnimeMap = new Map(
      (existingAnimeItems || []).map(item => [item.source_item_id, item.id])
    );

    // Step 2: Batch check existing manga items
    const mangaIds = mangaItems.map(item => item.id);
    const { data: existingMangaItems } = mangaIds.length > 0
      ? await supabase
          .from("manga")
          .select("id, source_item_id")
          .eq("source", "myanimelist")
          .in("source_item_id", mangaIds)
      : { data: null };

    const existingMangaMap = new Map(
      (existingMangaItems || []).map(item => [item.source_item_id, item.id])
    );

    // Step 3: Prepare new anime and manga items
    const newAnimeItems: Array<{
      source: string;
      source_item_id: string;
      title: string;
      genre?: string[];
      poster_url?: string;
      num_episodes?: number;
    }> = [];

    const newMangaItems: Array<{
      source: string;
      source_item_id: string;
      title: string;
      genre?: string[];
      poster_url?: string;
      num_chapters?: number;
    }> = [];

    const animeItemMap = new Map<string, string>();
    const mangaItemMap = new Map<string, string>();

    for (const item of animeItems) {
      const existingId = existingAnimeMap.get(item.id);
      if (existingId) {
        animeItemMap.set(item.id, existingId);
      } else {
        newAnimeItems.push({
          source: "myanimelist",
          source_item_id: item.id,
          title: item.title,
          genre: item.genre,
          poster_url: item.poster_url,
          num_episodes: item.num_episodes,
        });
      }
    }

    for (const item of mangaItems) {
      const existingId = existingMangaMap.get(item.id);
      if (existingId) {
        mangaItemMap.set(item.id, existingId);
      } else {
        newMangaItems.push({
          source: "myanimelist",
          source_item_id: item.id,
          title: item.title,
          genre: item.genre,
          poster_url: item.poster_url,
          num_chapters: item.num_chapters,
        });
      }
    }

    // Step 4: Batch insert new anime items
    if (newAnimeItems.length > 0) {
      const { data: insertedAnimeItems, error: insertError } = await supabase
        .from("anime")
        .insert(newAnimeItems)
        .select("id, source_item_id");

      if (insertError) {
        console.error("Error batch inserting anime items:", insertError);
        errors += newAnimeItems.length;
      } else {
        insertedAnimeItems?.forEach(item => {
          animeItemMap.set(item.source_item_id, item.id);
        });
      }
    }

    // Step 5: Batch insert new manga items
    if (newMangaItems.length > 0) {
      const { data: insertedMangaItems, error: insertError } = await supabase
        .from("manga")
        .insert(newMangaItems)
        .select("id, source_item_id");

      if (insertError) {
        console.error("Error batch inserting manga items:", insertError);
        errors += newMangaItems.length;
      } else {
        insertedMangaItems?.forEach(item => {
          mangaItemMap.set(item.source_item_id, item.id);
        });
      }
    }

    // Step 6: Prepare user_media records
    const userMediaRecords: Array<{
      user_id: string;
      media_type: string;
      media_id: string;
      rating?: number;
      timestamp: string; // ISO string for database
      tags?: string[];
    }> = [];

    for (const item of animeItems) {
      const animeId = animeItemMap.get(item.id);
      if (!animeId) {
        errors++;
        continue;
      }

      // Ensure timestamp is always a valid Date, then convert to ISO string
      let timestamp = new Date();
      if (item.listStatus?.updated_at) {
        const date = new Date(item.listStatus.updated_at);
        if (!isNaN(date.getTime())) {
          timestamp = date;
        }
      }

      const rating = item.listStatus?.score && item.listStatus.score > 0
        ? item.listStatus.score
        : undefined;

      userMediaRecords.push({
        user_id: userId,
        media_type: "anime",
        media_id: animeId,
        rating,
        timestamp: timestamp.toISOString(),
        tags: item.listStatus?.status ? [item.listStatus.status] : undefined,
      });
    }

    for (const item of mangaItems) {
      const mangaId = mangaItemMap.get(item.id);
      if (!mangaId) {
        errors++;
        continue;
      }

      // Ensure timestamp is always a valid Date, then convert to ISO string
      let timestamp = new Date();
      if (item.listStatus?.updated_at) {
        const date = new Date(item.listStatus.updated_at);
        if (!isNaN(date.getTime())) {
          timestamp = date;
        }
      }

      const rating = item.listStatus?.score && item.listStatus.score > 0
        ? item.listStatus.score
        : undefined;

      userMediaRecords.push({
        user_id: userId,
        media_type: "manga",
        media_id: mangaId,
        rating,
        timestamp: timestamp.toISOString(),
        tags: item.listStatus?.status ? [item.listStatus.status] : undefined,
      });
    }

    // Step 7: Batch upsert user_media records
    if (userMediaRecords.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < userMediaRecords.length; i += BATCH_SIZE) {
        const batch = userMediaRecords.slice(i, i + BATCH_SIZE);
        const { error: userMediaError } = await supabase
          .from("user_media")
          .upsert(batch, {
            onConflict: "user_id,media_type,media_id",
          });

        if (userMediaError) {
          console.error(`Error batch upserting user_media (batch ${i / BATCH_SIZE + 1}):`, userMediaError);
          errors += batch.length;
        } else {
          // Count anime vs manga in this batch
          for (const record of batch) {
            if (record.media_type === "anime") {
              animeImported++;
            } else if (record.media_type === "manga") {
              mangaImported++;
            }
          }
        }
      }
    }

    return { animeImported, mangaImported, errors };
  } catch (error) {
    console.error("Error syncing MAL data:", error);
    throw error;
  }
}

