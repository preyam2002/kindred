import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getSpotifyAuthUrl } from "@/lib/integrations/spotify";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url).toString()
      );
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

    // Generate state for CSRF protection
    const state = Buffer.from(session.user.id).toString("base64url");

    // Store state in cookie
    const cookieStore = await cookies();
    cookieStore.set("spotify_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    // Redirect to Spotify authorization
    const authUrl = getSpotifyAuthUrl(callbackUrl, state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Spotify OAuth:", error);
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("error", "spotify_oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
