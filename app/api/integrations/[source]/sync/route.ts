import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { syncSpotifyData, refreshSpotifyToken } from "@/lib/integrations/spotify";
import { syncMALData } from "@/lib/integrations/myanimelist";
import { supabase } from "@/lib/db/supabase";
import { scrapeGoodreadsProfile } from "@/lib/scrapers/goodreads-scraper";
import { importGoodreadsScraped } from "@/lib/integrations/goodreads";
import { scrapeLetterboxdProfile } from "@/lib/scrapers/letterboxd-scraper";
import { importLetterboxdScraped } from "@/lib/integrations/letterboxd";

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
      const { data: goodreadsSource, error: goodreadsError } = await supabase
        .from("sources")
        .select("id, source_user_id, access_token")
        .eq("user_id", session.user.id)
        .eq("source_name", "goodreads")
        .single();

      if (goodreadsError || !goodreadsSource) {
        return NextResponse.json(
          { error: "Goodreads not connected" },
          { status: 404 }
        );
      }

      const identifier = extractGoodreadsIdentifier(
        goodreadsSource.source_user_id || goodreadsSource.access_token
      );

      if (!identifier) {
        return NextResponse.json(
          {
            error:
              "Missing Goodreads profile reference. Please re-upload a CSV or scrape your profile to enable syncing.",
          },
          { status: 400 }
        );
      }

      try {
        const profile = await scrapeGoodreadsProfile(identifier);
        const profileUrl =
          goodreadsSource.source_user_id ||
          goodreadsSource.access_token ||
          `https://www.goodreads.com/user/show/${identifier}`;
        const result = await importGoodreadsScraped(
          session.user.id,
          profile,
          profileUrl
        );

        return NextResponse.json({
          success: true,
          message: `Synced ${result.imported} books${
            result.errors > 0 ? ` (${result.errors} errors)` : ""
          }`,
          imported: result.imported,
          errors: result.errors,
        });
      } catch (error: any) {
        console.error("Goodreads sync failed:", error);
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Failed to sync Goodreads data. Please try again.",
          },
          { status: 500 }
        );
      }
    }
    case "letterboxd": {
      const { data: letterboxdSource, error: letterboxdError } = await supabase
        .from("sources")
        .select("id, source_user_id, access_token")
        .eq("user_id", session.user.id)
        .eq("source_name", "letterboxd")
        .single();

      if (letterboxdError || !letterboxdSource) {
        return NextResponse.json(
          { error: "Letterboxd not connected" },
          { status: 404 }
        );
      }

      const username = extractLetterboxdUsername(
        letterboxdSource.source_user_id || letterboxdSource.access_token
      );

      if (!username) {
        return NextResponse.json(
          {
            error:
              "Missing Letterboxd username. Please re-upload a CSV or scrape your profile to enable syncing.",
          },
          { status: 400 }
        );
      }

      try {
        const profile = await scrapeLetterboxdProfile(username);
        const profileUrl =
          letterboxdSource.source_user_id ||
          letterboxdSource.access_token ||
          `https://letterboxd.com/${username}/`;
        const result = await importLetterboxdScraped(
          session.user.id,
          profile,
          profileUrl
        );

        return NextResponse.json({
          success: true,
          message: `Synced ${result.imported} films${
            result.errors > 0 ? ` (${result.errors} errors)` : ""
          }`,
          imported: result.imported,
          errors: result.errors,
        });
      } catch (error: any) {
        console.error("Letterboxd sync failed:", error);
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Failed to sync Letterboxd data. Please try again.",
          },
          { status: 500 }
        );
      }
    }
    case "myanimelist": {
      const { data: malSource, error: malError } = await supabase
        .from("sources")
        .select("source_user_id")
        .eq("user_id", session.user.id)
        .eq("source_name", "myanimelist")
        .single();

      if (malError || !malSource || !malSource.source_user_id) {
        return NextResponse.json(
          {
            error:
              "MyAnimeList not connected or missing username. Please reconnect to MyAnimeList.",
          },
          { status: 404 }
        );
      }

      try {
        const result = await syncMALData(session.user.id);
        return NextResponse.json({
          success: true,
          message: `Synced ${result.animeImported} anime and ${result.mangaImported} manga${
            result.errors > 0 ? ` (${result.errors} errors)` : ""
          }`,
          ...result,
        });
      } catch (error: any) {
        console.error("MyAnimeList sync failed:", error);
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Failed to sync MyAnimeList data. Please try again.",
          },
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

function extractGoodreadsIdentifier(rawValue?: string | null): string | null {
  if (!rawValue) return null;
  const value = rawValue.trim();
  if (!value) return null;

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(/\/user\/show\/([^/]+)/);
      if (match?.[1]) {
        return match[1];
      }
    } catch (error) {
      // Ignore URL parsing errors and fall back below
    }
  }

  return value || null;
}

function extractLetterboxdUsername(rawValue?: string | null): string | null {
  if (!rawValue) return null;
  let value = rawValue.trim();
  if (!value) return null;

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        value = segments[0];
      }
    } catch (error) {
      // Ignore URL parsing errors and fall back below
    }
  }

  value = value.replace(/^@/, "").replace(/\/+$/, "");
  return value || null;
}

