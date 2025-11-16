import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { scrapeGoodreadsProfile } from "@/lib/scrapers/goodreads-scraper";
import { importGoodreadsScraped } from "@/lib/integrations/goodreads";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Goodreads source
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("source_name", "goodreads")
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "Goodreads not connected. Please connect via scraper or CSV upload first." },
        { status: 404 }
      );
    }

    // Extract username/ID from source_user_id (could be URL or username)
    const identifier = extractGoodreadsIdentifier(source.source_user_id);
    
    if (!identifier) {
      return NextResponse.json(
        { error: "No Goodreads username found. Please reconnect via scraper with your username." },
        { status: 400 }
      );
    }

    try {
      // Scrape the profile
      const profile = await scrapeGoodreadsProfile(identifier);
      
      // Re-import with the scraped data
      const profileUrl = source.source_user_id?.startsWith("http") 
        ? source.source_user_id 
        : `https://www.goodreads.com/user/show/${profile.userId}`;
      
      const result = await importGoodreadsScraped(
        session.user.id,
        profile,
        profileUrl
      );

      return NextResponse.json({
        success: true,
        message: `Synced ${result.imported} books${
          result.errors > 0 ? ` (${result.errors} errors)` : ""
        }`,
        imported: result.imported,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error("Goodreads sync failed:", error);
      return NextResponse.json(
        {
          error:
            error?.message ||
            "Failed to sync Goodreads data. Please try again or re-upload CSV.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error syncing Goodreads:", error);
    return NextResponse.json(
      { error: "Failed to sync Goodreads data" },
      { status: 500 }
    );
  }
}

function extractGoodreadsIdentifier(rawValue?: string | null): string | null {
  if (!rawValue) return null;
  const value = rawValue.trim();
  if (!value) return null;

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(/\/user\/show\/([^/]+)/);
      if (match?.[1]) {
        return match[1];
      }
    } catch (error) {
      // Ignore URL parsing errors and fall back below
    }
  }

  return value || null;
}
