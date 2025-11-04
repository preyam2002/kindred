import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { syncSpotifyData, refreshSpotifyToken } from "@/lib/integrations/spotify";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Spotify source
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("source_name", "spotify")
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "Spotify not connected" },
        { status: 404 }
      );
    }

    if (!source.access_token) {
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = source.access_token;
    if (source.expires_at && new Date(source.expires_at) < new Date()) {
      if (!source.refresh_token) {
        return NextResponse.json(
          { error: "Token expired and no refresh token available" },
          { status: 400 }
        );
      }

      try {
        const tokens = await refreshSpotifyToken(source.refresh_token);
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
          .eq("id", source.id);
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
  } catch (error) {
    console.error("Error syncing Spotify:", error);
    return NextResponse.json(
      { error: "Failed to sync Spotify data" },
      { status: 500 }
    );
  }
}


