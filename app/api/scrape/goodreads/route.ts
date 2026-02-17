import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { scrapeGoodreadsProfile } from "@/lib/scrapers/goodreads-scraper";
import { importGoodreadsScraped } from "@/lib/integrations/goodreads";
import { UnauthorizedError, ValidationError, formatErrorResponse } from "@/lib/errors";

interface AppError extends Error {
  statusCode?: number;
}

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
    const { username, userId, profileUrl } = body;

    if (!username && !userId) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("Username or userId required")),
        { status: 400 }
      );
    }

    // Scrape Goodreads profile
    const profile = await scrapeGoodreadsProfile(username || userId);

    // Import scraped data using the same pattern as CSV import
    const result = await importGoodreadsScraped(
      session.user.id,
      profile,
      profileUrl
    );

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      message: `Successfully imported ${result.imported} books${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
      profile: {
        username: profile.username,
        userId: profile.userId,
        totalBooks: profile.totalBooks,
      },
    });
  } catch (error) {
    console.error("Error in Goodreads scrape API:", error);
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as AppError).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

// GET endpoint for preview (no storage)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const userId = searchParams.get("userId");

    if (!username && !userId) {
      return NextResponse.json(
        { error: "Username or userId required" },
        { status: 400 }
      );
    }

    // Scrape Goodreads profile
    const profile = await scrapeGoodreadsProfile(username || userId || "");

    return NextResponse.json({
      success: true,
      username: profile.username,
      userId: profile.userId,
      totalBooks: profile.totalBooks,
      books: profile.books.slice(0, 20), // Return top 20 for preview
    });
  } catch (error) {
    console.error("Error in Goodreads preview API:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape Goodreads profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
