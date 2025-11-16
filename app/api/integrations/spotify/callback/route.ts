import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  exchangeSpotifyToken,
  getSpotifyUserProfile,
  syncSpotifyData,
} from "@/lib/integrations/spotify";
import { getFrontendOrigin } from "@/lib/utils";
import { supabase } from "@/lib/db/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get frontend origin early for all redirects
    const frontendOrigin = getFrontendOrigin(request);
    console.log("[Spotify][Callback] Incoming request", {
      frontendOrigin,
      requestUrl: request.url,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      headers: {
        host: request.headers.get("host"),
        xForwardedHost: request.headers.get("x-forwarded-host"),
        xForwardedProto: request.headers.get("x-forwarded-proto"),
      },
    });

    const session = await auth();

    if (!session?.user?.id) {
      console.warn("[Spotify][Callback] No session user id, redirecting to login");
      return NextResponse.redirect(`${frontendOrigin}/auth/login`);
    }
    console.log("[Spotify][Callback] Authenticated session", {
      userId: session.user.id,
    });

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("[Spotify][Callback] OAuth error returned from Spotify", {
        error,
      });
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", `spotify_${error}`);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      console.error("[Spotify][Callback] Missing authorization code");
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "missing_code");
      return NextResponse.redirect(redirectUrl);
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("spotify_state")?.value;
    const expectedState = Buffer.from(session.user.id).toString("base64url");

    // State must match both the stored cookie and the expected value
    if (!state || state !== storedState || state !== expectedState) {
      console.error("State validation failed:", {
        received: state,
        stored: storedState,
        expected: expectedState,
      });
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "invalid_state");
      return NextResponse.redirect(redirectUrl);
    }

    // Get callback URL - use the frontend origin from request headers
    const callbackUrl = `${frontendOrigin}/api/integrations/spotify/callback`;
    console.log("[Spotify][Callback] Exchanging code for tokens", {
      callbackUrl,
    });

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeSpotifyToken(code, callbackUrl);
    } catch (error: any) {
      console.error("[Spotify][Callback] Error exchanging Spotify token", {
        error: error.message,
        callbackUrl,
        hasCode: !!code,
      });
      const frontendOrigin = getFrontendOrigin(request);
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "spotify_token_exchange_failed");
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile
    const userProfile = await getSpotifyUserProfile(tokens.access_token);
    console.log("[Spotify][Callback] Retrieved user profile", {
      spotifyUserId: userProfile?.id,
      displayName: userProfile?.display_name,
    });

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Store in database
    const { data: existingSource } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("source_name", "spotify")
      .single();

    if (existingSource) {
      console.log("[Spotify][Callback] Updating existing source", {
        sourceId: existingSource.id,
      });
      // Update existing source
      await supabase
        .from("sources")
        .update({
          source_user_id: userProfile.id || "",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);
    } else {
      console.log("[Spotify][Callback] Creating new source record");
      // Create new source
      await supabase.from("sources").insert({
        user_id: session.user.id,
        source_name: "spotify",
        source_user_id: userProfile.id || "",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
      });
    }

    // Clean up cookies
    cookieStore.delete("spotify_state");
    console.log("[Spotify][Callback] Cleared state cookie");

    // Perform initial sync (await to ensure completion)
    let syncResult: { tracksImported: number; errors: number } | null = null;
    try {
      console.log("[Spotify][Callback] Starting initial sync");
      syncResult = await syncSpotifyData(session.user.id, tokens.access_token);
      console.log("[Spotify][Callback] Sync completed", syncResult);
    } catch (syncError) {
      console.error("[Spotify][Callback] Error syncing initial Spotify data", syncError);
    }

    // Redirect to settings with success message - use frontend origin
    const redirectUrl = new URL("/settings", frontendOrigin);
    redirectUrl.searchParams.set("connected", "spotify");

    if (syncResult) {
      redirectUrl.searchParams.set(
        "syncedTracks",
        syncResult.tracksImported.toString()
      );
      if (syncResult.errors > 0) {
        redirectUrl.searchParams.set(
          "syncErrors",
          syncResult.errors.toString()
        );
      }
    } else {
      redirectUrl.searchParams.set("warning", "spotify_sync_failed");
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[Spotify][Callback] Unexpected error", error);
    const frontendOrigin = getFrontendOrigin(request);
    const redirectUrl = new URL("/settings", frontendOrigin);
    redirectUrl.searchParams.set("error", "spotify_callback_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
