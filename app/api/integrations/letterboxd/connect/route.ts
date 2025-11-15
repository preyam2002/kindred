import { NextRequest, NextResponse } from "next/server";

// This route is kept for compatibility but redirects to settings
// The actual upload happens via POST to /upload
export async function GET(request: NextRequest) {
  // Redirect to settings page where user can upload CSV
  const redirectUrl = new URL("/settings", request.url);
  redirectUrl.searchParams.set(
    "hint",
    "letterboxd_upload"
  );
  return NextResponse.redirect(redirectUrl);
}





