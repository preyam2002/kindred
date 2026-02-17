import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  exchangeMALToken,
  getMALUserProfile,
  syncMALData,
} from "@/lib/integrations/myanimelist";
import { getFrontendOrigin } from "@/lib/utils";
import { supabase } from "@/lib/db/supabase";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const frontendOrigin = getFrontendOrigin(request);
    console.log("[MAL][Callback] Incoming request", {
      frontendOrigin,
      requestUrl: request.url,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
    });

    const session = await auth();

    if (!session?.user?.id) {
      console.warn("[MAL][Callback] No session user id, redirecting to login");
      return NextResponse.redirect(`${frontendOrigin}/auth/login`);
    }

    console.log("[MAL][Callback] Authenticated session", {
      userId: session.user.id,
    });

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("[MAL][Callback] OAuth error returned from MAL", {
        error,
      });
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", `mal_${error}`);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      console.error("[MAL][Callback] Missing authorization code");
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "missing_code");
      return NextResponse.redirect(redirectUrl);
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("mal_state")?.value;
    const codeVerifier = cookieStore.get("mal_code_verifier")?.value;
    const expectedState = Buffer.from(session.user.id).toString("base64url");

    if (!codeVerifier) {
      console.error("[MAL][Callback] Missing code_verifier cookie");
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "missing_code_verifier");
      return NextResponse.redirect(redirectUrl);
    }

    // State must match both the stored cookie and the expected value
    if (!state || state !== storedState || state !== expectedState) {
      console.error("[MAL][Callback] State validation failed:", {
        received: state,
        stored: storedState,
        expected: expectedState,
      });
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "invalid_state");
      return NextResponse.redirect(redirectUrl);
    }

    // Get callback URL
    const callbackUrl = `${frontendOrigin}/api/integrations/myanimelist/callback`;
    console.log("[MAL][Callback] Exchanging code for tokens", {
      callbackUrl,
    });

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeMALToken(code, codeVerifier, callbackUrl);
    } catch (error) {
      console.error("[MAL][Callback] Error exchanging MAL token", {
        error: error instanceof Error ? error.message : "Unknown error",
        callbackUrl,
        hasCode: !!code,
      });
      const redirectUrl = new URL("/settings", frontendOrigin);
      redirectUrl.searchParams.set("error", "mal_token_exchange_failed");
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile to get username
    let userProfile;
    try {
      userProfile = await getMALUserProfile(tokens.access_token);
      console.log("[MAL][Callback] Retrieved user profile", {
        malUserId: userProfile?.id,
        malUsername: userProfile?.name,
      });
    } catch (error) {
      console.error("[MAL][Callback] Error fetching user profile", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Continue anyway - we can still store tokens
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Store in database
    const { data: existingSource } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("source_name", "myanimelist")
      .single();

    if (existingSource) {
      console.log("[MAL][Callback] Updating existing source", {
        sourceId: existingSource.id,
      });
      // Update existing source
      await supabase
        .from("sources")
        .update({
          source_user_id: userProfile?.name || session.user.email?.split("@")[0] || "",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);
    } else {
      console.log("[MAL][Callback] Creating new source record");
      // Create new source
      await supabase.from("sources").insert({
        user_id: session.user.id,
        source_name: "myanimelist",
        source_user_id: userProfile?.name || session.user.email?.split("@")[0] || "",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
      });
    }

    // Clean up cookies
    cookieStore.delete("mal_state");
    cookieStore.delete("mal_code_verifier");
    console.log("[MAL][Callback] Cleared state cookies");

    // Perform initial sync (await to ensure completion)
    let syncResult: { animeImported: number; mangaImported: number; errors: number } | null = null;
    try {
      console.log("[MAL][Callback] Starting initial sync");
      syncResult = await syncMALData(session.user.id);
      console.log("[MAL][Callback] Initial sync completed", syncResult);
    } catch (syncError) {
      console.error("[MAL][Callback] Error during initial sync", {
        error: syncError instanceof Error ? syncError.message : "Unknown error",
      });
      // Continue to redirect even if sync fails
    }

    // Redirect to settings with success message
    const redirectUrl = new URL("/settings", frontendOrigin);
    redirectUrl.searchParams.set("mal_connected", "true");
    if (syncResult) {
      redirectUrl.searchParams.set("anime_imported", syncResult.animeImported.toString());
      redirectUrl.searchParams.set("manga_imported", syncResult.mangaImported.toString());
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[MAL][Callback] Unexpected error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    const frontendOrigin = getFrontendOrigin(request);
    const redirectUrl = new URL("/settings", frontendOrigin);
    redirectUrl.searchParams.set("error", "mal_callback_error");
    return NextResponse.redirect(redirectUrl);
  }
}
