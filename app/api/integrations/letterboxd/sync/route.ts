import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { scrapeLetterboxdProfile } from "@/lib/scrapers/letterboxd-scraper";
import { importLetterboxdScraped } from "@/lib/integrations/letterboxd";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Letterboxd source
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("source_name", "letterboxd")
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "Letterboxd not connected. Please connect via scraper or CSV upload first." },
        { status: 404 }
      );
    }

    // Extract username from source_user_id (could be URL or username)
    const username = extractLetterboxdUsername(source.source_user_id);
    
    if (!username) {
      return NextResponse.json(
        { error: "No Letterboxd username found. Please reconnect via scraper with your username." },
        { status: 400 }
      );
    }

    try {
      // Scrape the profile
      const profile = await scrapeLetterboxdProfile(username);
      
      // Re-import with the scraped data
      const profileUrl = source.source_user_id?.startsWith("http") 
        ? source.source_user_id 
        : `https://letterboxd.com/${username}/`;
      
      const result = await importLetterboxdScraped(
        session.user.id,
        profile,
        profileUrl
      );

      return NextResponse.json({
        success: true,
        message: `Synced ${result.imported} films${
          result.errors > 0 ? ` (${result.errors} errors)` : ""
        }`,
        imported: result.imported,
        errors: result.errors,
      });
    } catch (error: any) {
      console.error("Letterboxd sync failed:", error);
      return NextResponse.json(
        {
          error:
            error?.message ||
            "Failed to sync Letterboxd data. Please try again or re-upload CSV.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error syncing Letterboxd:", error);
    return NextResponse.json(
      { error: "Failed to sync Letterboxd data" },
      { status: 500 }
    );
  }
}

function extractLetterboxdUsername(rawValue?: string | null): string | null {
  if (!rawValue) return null;
  let value = rawValue.trim();
  if (!value) return null;

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        value = segments[0];
      }
    } catch (error) {
      // Ignore URL parsing errors and fall back below
    }
  }

  value = value.replace(/^@/, "").replace(/\/+$/, "");
  return value || null;
}






