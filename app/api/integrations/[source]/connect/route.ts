import { NextRequest, NextResponse } from "next/server";

// Route handler that delegates to specific integration handlers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  // Redirect to specific integration handler
  switch (source) {
    case "goodreads":
      return NextResponse.redirect(
        new URL("/api/integrations/goodreads/connect", request.url)
      );
    case "letterboxd":
      return NextResponse.redirect(
        new URL("/api/integrations/letterboxd/connect", request.url)
      );
    case "myanimelist":
      return NextResponse.redirect(
        new URL("/api/integrations/myanimelist/connect", request.url)
      );
    case "spotify":
      return NextResponse.redirect(
        new URL("/api/integrations/spotify/connect", request.url)
      );
    default:
      return NextResponse.json(
        { error: "Unknown integration" },
        { status: 404 }
      );
  }
}

