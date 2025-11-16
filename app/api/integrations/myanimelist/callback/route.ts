import { NextRequest, NextResponse } from "next/server";

/**
 * MAL OAuth callback route - DEPRECATED
 * OAuth is no longer required for MAL - we use username-based connection instead
 * This route is kept for backwards compatibility but redirects with an error message
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/settings", request.url);
  redirectUrl.searchParams.set("error", "mal_oauth_deprecated");
  return NextResponse.redirect(redirectUrl);
}


