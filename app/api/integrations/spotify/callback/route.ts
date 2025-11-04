import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  exchangeSpotifyToken,
  getSpotifyUserProfile,
  syncSpotifyData,
} from "@/lib/integrations/spotify";
import { supabase } from "@/lib/db/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url).toString()
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("error", `spotify_${error}`);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("error", "missing_code");
      return NextResponse.redirect(redirectUrl);
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("spotify_state")?.value;
    const expectedState = Buffer.from(session.user.id).toString("base64url");

    if (state !== storedState || state !== expectedState) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("error", "invalid_state");
      return NextResponse.redirect(redirectUrl);
    }

    // Get callback URL
    const callbackUrlObj = new URL(
      "/api/integrations/spotify/callback",
      request.url
    );
    if (callbackUrlObj.hostname === "localhost") {
      callbackUrlObj.hostname = "127.0.0.1";
    }
    const callbackUrl = callbackUrlObj.toString();

    // Exchange code for tokens
    const tokens = await exchangeSpotifyToken(code, callbackUrl);

    // Get user profile
    const userProfile = await getSpotifyUserProfile(tokens.access_token);

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

    // Sync initial data (async, don't wait)
    syncSpotifyData(session.user.id, tokens.access_token).catch((error) => {
      console.error("Error syncing initial Spotify data:", error);
    });

    // Redirect to settings with success message
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("connected", "spotify");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in Spotify callback:", error);
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("error", "spotify_callback_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
