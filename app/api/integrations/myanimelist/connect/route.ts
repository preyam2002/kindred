import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { generatePKCE, getMALAuthUrl } from "@/lib/integrations/myanimelist";
import { getFrontendOrigin } from "@/lib/utils";
import { cookies } from "next/headers";

/**
 * Initiate MAL OAuth flow
 * GET /api/integrations/myanimelist/connect
 */
export async function GET(request: NextRequest) {
  try {
    const frontendOrigin = getFrontendOrigin(request);
    console.log("[MAL][Connect] Incoming request", {
      frontendOrigin,
      requestUrl: request.url,
    });

    const session = await auth();

    if (!session?.user?.id) {
      console.warn("[MAL][Connect] No session user id, redirecting to login");
      return NextResponse.redirect(`${frontendOrigin}/auth/login`);
    }

    // Get callback URL
    const callbackUrl = `${frontendOrigin}/api/integrations/myanimelist/callback`;
    console.log("[MAL][Connect] Using callback URL", { callbackUrl });

    // Generate PKCE for OAuth
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Generate state for CSRF protection
    const state = Buffer.from(session.user.id).toString("base64url");
    console.log("[MAL][Connect] Generated state and PKCE", {
      userId: session.user.id,
      state,
    });

    // Store state and code_verifier in cookies
    const cookieStore = await cookies();
    const isSecure = frontendOrigin.startsWith("https://") || process.env.NODE_ENV === "production";
    
    cookieStore.set("mal_state", state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    cookieStore.set("mal_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    // Redirect to MAL authorization
    const authUrl = getMALAuthUrl(state, codeChallenge, callbackUrl);
    console.log("[MAL][Connect] Redirecting to MAL", { authUrl });
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[MAL][Connect] Error initiating OAuth", error);
    const frontendOrigin = getFrontendOrigin(request);
    const redirectUrl = new URL("/settings", frontendOrigin);
    redirectUrl.searchParams.set("error", "mal_oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}

/**
 * Legacy POST endpoint for username-based connection (fallback)
 * POST /api/integrations/myanimelist/connect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists in database
    const { supabase } = await import("@/lib/db/supabase");
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (userError) {
      console.error("Error checking user:", userError);
      return NextResponse.json(
        { error: "Database error. Please try logging out and back in." },
        { status: 500 }
      );
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found. Please log out and log back in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const username = body.username?.trim();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username by trying to fetch their public list
    const { getMALAnimeList } = await import("@/lib/integrations/myanimelist");
    try {
      await getMALAnimeList(username, 1, 0);
    } catch (error) {
      if (error instanceof Error && error.message?.includes("404") || error instanceof Error && error.message?.includes("Not Found")) {
        return NextResponse.json(
          { error: "MyAnimeList username not found or profile is private" },
          { status: 404 }
        );
      }
      console.warn("Warning: Could not validate MAL username:", error);
    }

    // Check if source already exists
    const { data: existingSource, error: checkError } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("source_name", "myanimelist")
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.warn("Error checking for existing MAL source:", checkError);
    }

    if (existingSource) {
      // Update existing source with username (but no OAuth tokens)
      const { error: updateError } = await supabase
        .from("sources")
        .update({
          source_user_id: username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);

      if (updateError) {
        console.error("Error updating MAL source:", updateError);
        return NextResponse.json(
          { error: "Failed to update MyAnimeList connection" },
          { status: 500 }
        );
      }
    } else {
      // Create new source (without OAuth tokens)
      const { error: insertError } = await supabase
        .from("sources")
        .insert({
          user_id: session.user.id,
          source_name: "myanimelist",
          source_user_id: username,
        });

      if (insertError) {
        console.error("Error creating MAL source:", insertError);
        return NextResponse.json(
          { 
            error: "Failed to create MyAnimeList connection",
            details: insertError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "MyAnimeList connected (username only). For ratings, please use OAuth connection.",
      warning: true,
    });
  } catch (error) {
    console.error("Error connecting MAL:", error);
    return NextResponse.json(
      { error: "Failed to connect MyAnimeList" },
      { status: 500 }
    );
  }
}
