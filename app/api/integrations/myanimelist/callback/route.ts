import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  exchangeMALToken,
  getMALUserProfile,
  syncMALData,
} from "@/lib/integrations/myanimelist";
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

    if (!code) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("error", "missing_code");
      return NextResponse.redirect(redirectUrl);
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("mal_state")?.value;
    const expectedState = Buffer.from(session.user.id).toString("base64url");

    if (state !== storedState || state !== expectedState) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("error", "invalid_state");
      return NextResponse.redirect(redirectUrl);
    }

    // Get code verifier from cookie
    const codeVerifier = cookieStore.get("mal_code_verifier")?.value;

    if (!codeVerifier) {
      const redirectUrl = new URL("/settings", request.url);
      redirectUrl.searchParams.set("error", "missing_code_verifier");
      return NextResponse.redirect(redirectUrl);
    }

    // Get callback URL
    const callbackUrlObj = new URL(
      "/api/integrations/myanimelist/callback",
      request.url
    );
    if (callbackUrlObj.hostname === "localhost") {
      callbackUrlObj.hostname = "127.0.0.1";
    }
    const callbackUrl = callbackUrlObj.toString();

    // Exchange code for tokens
    const tokens = await exchangeMALToken(code, codeVerifier, callbackUrl);

    // Get user profile
    const userProfile = await getMALUserProfile(tokens.access_token);

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
      // Update existing source
      await supabase
        .from("sources")
        .update({
          source_user_id: userProfile.id?.toString() || "",
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
        source_name: "myanimelist",
        source_user_id: userProfile.id?.toString() || "",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
      });
    }

    // Clean up cookies
    cookieStore.delete("mal_code_verifier");
    cookieStore.delete("mal_state");

    // Sync initial data (async, don't wait)
    syncMALData(session.user.id, tokens.access_token).catch((error) => {
      console.error("Error syncing initial MAL data:", error);
    });

    // Redirect to settings with success message
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("connected", "myanimelist");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in MAL callback:", error);
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("error", "mal_callback_failed");
    return NextResponse.redirect(redirectUrl);
  }
}


