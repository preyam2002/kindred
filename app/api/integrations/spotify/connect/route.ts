import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getSpotifyAuthUrl } from "@/lib/integrations/spotify";
import { getFrontendOrigin } from "@/lib/utils";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get frontend origin early for all redirects
    const frontendOrigin = getFrontendOrigin(request);
    console.log("[Spotify][Connect] Incoming request", {
      frontendOrigin,
      requestUrl: request.url,
      headers: {
        host: request.headers.get("host"),
        xForwardedHost: request.headers.get("x-forwarded-host"),
        xForwardedProto: request.headers.get("x-forwarded-proto"),
      },
    });
    
    const session = await auth();

    if (!session?.user?.id) {
      console.warn("[Spotify][Connect] No session user id, redirecting to login");
      return NextResponse.redirect(
        `${frontendOrigin}/auth/login`
      );
    }

    // Get callback URL - use the frontend origin from request headers
    const callbackUrl = `${frontendOrigin}/api/integrations/spotify/callback`;
    console.log("[Spotify][Connect] Using callback URL", { callbackUrl });

    // Generate state for CSRF protection
    const state = Buffer.from(session.user.id).toString("base64url");
    console.log("[Spotify][Connect] Generated state", {
      userId: session.user.id,
      state,
    });

    // Store state in cookie
    // Use secure for HTTPS (ngrok uses HTTPS, so this should be true)
    const cookieStore = await cookies();
    const isSecure = frontendOrigin.startsWith("https://") || process.env.NODE_ENV === "production";
    console.log("[Spotify][Connect] Setting state cookie", {
      isSecure,
      sameSite: "lax",
      maxAge: 600,
    });
    cookieStore.set("spotify_state", state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    // Redirect to Spotify authorization
    const authUrl = getSpotifyAuthUrl(callbackUrl, state);
    console.log("[Spotify][Connect] Redirecting to Spotify", { authUrl });
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Spotify][Connect] Error initiating OAuth", error);
    const frontendOrigin = getFrontendOrigin(request);
    const redirectUrl = new URL("/settings", frontendOrigin);
    redirectUrl.searchParams.set("error", "spotify_oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
