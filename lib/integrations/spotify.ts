// Spotify OAuth 2.0 integration utilities
import { supabase } from "@/lib/db/supabase";

const SPOTIFY_BASE_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";

/**
 * Get authorization URL for Spotify
 */
export function getSpotifyAuthUrl(
  redirectUri: string,
  state?: string
): string {
  const scopes = [
    "user-read-private",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri,
    show_dialog: "false",
  });

  if (state) {
    params.append("state", state);
  }

  return `${SPOTIFY_BASE_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeSpotifyToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange token: ${response.statusText} - ${error}`);
  }

  return await response.json();
}

/**
 * Refresh access token
 */
export async function refreshSpotifyToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(`${SPOTIFY_BASE_URL}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get authenticated user's profile
 */
export async function getSpotifyUserProfile(accessToken: string): Promise<any> {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get user's saved tracks
 */
export async function getSpotifySavedTracks(
  accessToken: string,
  limit: number = 50,
  offset: number = 0
): Promise<any> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/me/tracks?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch saved tracks: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get user's top tracks
 */
export async function getSpotifyTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 50
): Promise<any> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top tracks: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get user's top artists
 */
export async function getSpotifyTopArtists(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 50
): Promise<any> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch top artists: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get user's recently played tracks
 */
export async function getSpotifyRecentlyPlayed(
  accessToken: string,
  limit: number = 50
): Promise<any> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/me/player/recently-played?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recently played tracks: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Sync user's Spotify data to database
 * Fetches saved tracks, top tracks (all time ranges), and recently played tracks
 */
export async function syncSpotifyData(
  userId: string,
  accessToken: string
): Promise<{ tracksImported: number; errors: number }> {
  // Verify user exists before proceeding
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    console.error(`User not found: ${userId}`, userError);
    throw new Error(`User not found: ${userId}`);
  }

  try {
    let tracksImported = 0;
    let errors = 0;

    // Collect all tracks first with their metadata
    const allTracks: Array<{ 
      track: any; 
      added_at?: string; 
      played_at?: string;
      tags: string[] 
    }> = [];

    // Fetch saved tracks (library)
    try {
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const tracksData = await getSpotifySavedTracks(accessToken, limit, offset);
        const tracks = tracksData.items || [];

        for (const item of tracks) {
          const track = item.track || item;
          if (track && track.id) {
            allTracks.push({
              track,
              added_at: item.added_at,
              tags: ["saved"],
            });
          }
        }

        hasMore = tracks.length === limit;
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching saved tracks:", error);
      errors++;
    }

    // Fetch top tracks for all time ranges
    const timeRanges: Array<{ range: "short_term" | "medium_term" | "long_term"; tag: string }> = [
      { range: "short_term", tag: "top_track_short" },
      { range: "medium_term", tag: "top_track_medium" },
      { range: "long_term", tag: "top_track_long" },
    ];

    for (const { range, tag } of timeRanges) {
      try {
        const topTracksData = await getSpotifyTopTracks(accessToken, range, 50);
        const topTracks = topTracksData.items || [];

        for (const track of topTracks) {
          if (track && track.id) {
            allTracks.push({
              track,
              tags: [tag],
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching top tracks (${range}):`, error);
        errors++;
      }
    }

    // Fetch recently played tracks
    try {
      const recentlyPlayedData = await getSpotifyRecentlyPlayed(accessToken, 50);
      const recentlyPlayed = recentlyPlayedData.items || [];

      for (const item of recentlyPlayed) {
        const track = item.track;
        if (track && track.id) {
          allTracks.push({
            track,
            played_at: item.played_at,
            tags: ["recently_played"],
          });
        }
      }
    } catch (error) {
      console.error("Error fetching recently played tracks:", error);
      errors++;
    }

    if (allTracks.length === 0) {
      return { tracksImported: 0, errors };
    }

    // Step 1: Batch check existing music items
    const trackIds = allTracks.map(t => t.track.id);
    const { data: existingMusicItems } = await supabase
      .from("music")
      .select("id, source_item_id")
      .eq("source", "spotify")
      .in("source_item_id", trackIds);

    const existingMusicMap = new Map(
      (existingMusicItems || []).map(item => [item.source_item_id, item.id])
    );

    // Step 2: Prepare new music items and user_media records
    const newMusicItems: Array<{
      source: string;
      source_item_id: string;
      title: string;
      artist?: string;
      album?: string;
      genre?: string[];
      poster_url?: string;
      duration_ms?: number;
    }> = [];

    const musicItemMap = new Map<string, string>();
    const userMediaRecords: Array<{
      user_id: string;
      media_type: string;
      media_id: string;
      rating?: number;
      timestamp: Date;
      tags?: string[];
    }> = [];

    for (const { track, added_at, played_at, tags } of allTracks) {
      const existingId = existingMusicMap.get(track.id);
      if (existingId) {
        musicItemMap.set(track.id, existingId);
      } else {
        newMusicItems.push({
          source: "spotify",
          source_item_id: track.id,
          title: track.name,
          artist: track.artists?.map((a: any) => a.name).join(", ") || undefined,
          album: track.album?.name || undefined,
          genre: track.artists?.map((a: any) => a.name) || undefined,
          poster_url: track.album?.images?.[0]?.url || undefined,
          duration_ms: track.duration_ms || undefined,
        });
      }
    }

    // Step 3: Batch insert new music items
    if (newMusicItems.length > 0) {
      const { data: insertedMusicItems, error: insertError } = await supabase
        .from("music")
        .insert(newMusicItems)
        .select("id, source_item_id");

      if (insertError) {
        console.error("Error batch inserting music items:", insertError);
        errors += newMusicItems.length;
      } else {
        insertedMusicItems?.forEach(item => {
          musicItemMap.set(item.source_item_id, item.id);
        });
      }
    }

    // Step 4: Prepare user_media records with polymorphic structure
    for (const { track, added_at, played_at, tags } of allTracks) {
      const musicId = musicItemMap.get(track.id);
      if (!musicId) {
        errors++;
        continue;
      }

      // Use played_at if available (for recently played), otherwise added_at, otherwise now
      const timestamp = played_at 
        ? new Date(played_at) 
        : added_at 
          ? new Date(added_at) 
          : new Date();

      userMediaRecords.push({
        user_id: userId,
        media_type: "music",
        media_id: musicId,
        rating: undefined,
        timestamp,
        tags,
      });
    }

    // Step 5: Batch upsert user_media records
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
          tracksImported += batch.length;
        }
      }
    }

    return { tracksImported, errors };
  } catch (error) {
    console.error("Error syncing Spotify data:", error);
    throw error;
  }
}


