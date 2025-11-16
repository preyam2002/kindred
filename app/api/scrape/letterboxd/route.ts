import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { scrapeLetterboxdProfile } from "@/lib/scrapers/letterboxd-scraper";
import { importLetterboxdScraped } from "@/lib/integrations/letterboxd";
import { UnauthorizedError, ValidationError, formatErrorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError()),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, profileUrl } = body;

    if (!username) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("Username required")),
        { status: 400 }
      );
    }

    // Scrape Letterboxd profile
    const profile = await scrapeLetterboxdProfile(username);

    // Import scraped data using the same pattern as CSV import
    const result = await importLetterboxdScraped(
      session.user.id,
      profile,
      profileUrl
    );

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      message: `Successfully imported ${result.imported} films${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        totalFilms: profile.totalFilms,
      },
    });
  } catch (error) {
    console.error("Error in Letterboxd scrape API:", error);
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as any).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

// GET endpoint for preview (no storage)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Scrape Letterboxd profile
    const profile = await scrapeLetterboxdProfile(username);

    return NextResponse.json({
      success: true,
      username: profile.username,
      displayName: profile.displayName,
      totalFilms: profile.totalFilms,
      films: profile.films.slice(0, 20), // Return top 20 for preview
    });
  } catch (error) {
    console.error("Error in Letterboxd preview API:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape Letterboxd profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
