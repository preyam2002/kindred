import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect to OG image endpoint
 * This provides a simpler URL for sharing images
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user1: string; user2: string }> }
) {
  const { user1, user2 } = await params;
  const baseUrl = request.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/api/mash/${user1}/${user2}/og`);
}






