import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { syncSpotifyData, refreshSpotifyToken } from "@/lib/integrations/spotify";
import { syncMALData } from "@/lib/integrations/myanimelist";
import { supabase } from "@/lib/db/supabase";

// Route handler that delegates to specific integration sync handlers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source } = await params;

  // Delegate to specific integration sync logic
  switch (source) {
    case "goodreads": {
      // For Goodreads, sync means re-upload CSV - redirect to upload endpoint
      return NextResponse.json(
        { error: "Please use the upload feature to sync Goodreads data" },
        { status: 400 }
      );
    }
    case "letterboxd": {
      // For Letterboxd, sync means re-upload CSV - redirect to upload endpoint
      return NextResponse.json(
        { error: "Please use the upload feature to sync Letterboxd data" },
        { status: 400 }
      );
    }
    case "myanimelist": {
      // Get MAL source
      const { data: malSource, error: malError } = await supabase
        .from("sources")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("source_name", "myanimelist")
        .single();

      if (malError || !malSource || !malSource.access_token) {
        return NextResponse.json(
          { error: "MyAnimeList not connected" },
          { status: 404 }
        );
      }

      try {
        const result = await syncMALData(session.user.id, malSource.access_token);
        return NextResponse.json({
          success: true,
          message: `Synced ${result.animeImported} anime and ${result.mangaImported} manga${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
          ...result,
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || "Failed to sync MyAnimeList data" },
          { status: 500 }
        );
      }
    }
    case "spotify": {
      // Get Spotify source
      const { data: spotifySource, error: spotifyError } = await supabase
        .from("sources")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("source_name", "spotify")
        .single();

      if (spotifyError || !spotifySource) {
        return NextResponse.json(
          { error: "Spotify not connected" },
          { status: 404 }
        );
      }

      if (!spotifySource.access_token) {
        return NextResponse.json(
          { error: "Invalid access token" },
          { status: 400 }
        );
      }

      // Check if token is expired and refresh if needed
      let accessToken = spotifySource.access_token;
      if (spotifySource.expires_at && new Date(spotifySource.expires_at) < new Date()) {
        if (!spotifySource.refresh_token) {
          return NextResponse.json(
            { error: "Token expired and no refresh token available" },
            { status: 400 }
          );
        }

        try {
          const tokens = await refreshSpotifyToken(spotifySource.refresh_token);
          accessToken = tokens.access_token;

          // Update tokens in database
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

          await supabase
            .from("sources")
            .update({
              access_token: tokens.access_token,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", spotifySource.id);
        } catch (error) {
          return NextResponse.json(
            { error: "Failed to refresh token. Please reconnect your account." },
            { status: 401 }
          );
        }
      }

      // Sync data
      const result = await syncSpotifyData(session.user.id, accessToken);

      return NextResponse.json({
        success: true,
        message: `Synced ${result.tracksImported} tracks${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
        tracksImported: result.tracksImported,
        errors: result.errors,
      });
    }
    default:
      return NextResponse.json(
        { error: "Unknown integration" },
        { status: 404 }
      );
  }
}

