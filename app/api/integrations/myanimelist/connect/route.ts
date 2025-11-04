import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getMALAuthUrl, generatePKCE } from "@/lib/integrations/myanimelist";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url).toString()
      );
    }

    // Generate PKCE codes
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Get callback URL
    const callbackUrlObj = new URL(
      "/api/integrations/myanimelist/callback",
      request.url
    );
    if (callbackUrlObj.hostname === "localhost") {
      callbackUrlObj.hostname = "127.0.0.1";
    }
    const callbackUrl = callbackUrlObj.toString();

    // Store code verifier in cookie
    const cookieStore = await cookies();
    cookieStore.set("mal_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    // Generate state for CSRF protection
    const state = Buffer.from(session.user.id).toString("base64url");
    cookieStore.set("mal_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });

    // Redirect to MAL authorization
    const authUrl = getMALAuthUrl(codeChallenge, callbackUrl, state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating MAL OAuth:", error);
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("error", "mal_oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}


