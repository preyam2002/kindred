import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getMALAnimeList, syncMALData } from "@/lib/integrations/myanimelist";
import { supabase } from "@/lib/db/supabase";

/**
 * Connect MAL by username (no OAuth needed for public lists)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const username = body.username?.trim();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username by trying to fetch their public list
    try {
      await getMALAnimeList(username, 1, 0);
    } catch (error: any) {
      if (error.message?.includes("404") || error.message?.includes("Not Found")) {
        return NextResponse.json(
          { error: "MyAnimeList username not found or profile is private" },
          { status: 404 }
        );
      }
      // If it's a different error, still allow connection (might be rate limit, etc.)
      console.warn("Warning: Could not validate MAL username:", error);
    }

    // Check if source already exists
    const { data: existingSource, error: checkError } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("source_name", "myanimelist")
      .maybeSingle();

    // If there's an error other than "not found", log it but continue
    if (checkError && checkError.code !== "PGRST116") {
      console.warn("Error checking for existing MAL source:", checkError);
    }

    if (existingSource) {
      // Update existing source with username
      const { error: updateError } = await supabase
        .from("sources")
        .update({
          source_user_id: username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);

      if (updateError) {
        console.error("Error updating MAL source:", updateError);
        return NextResponse.json(
          { error: "Failed to update MyAnimeList connection" },
          { status: 500 }
        );
      }
    } else {
      // Create new source
      const { data: insertedData, error: insertError } = await supabase
        .from("sources")
        .insert({
          user_id: session.user.id,
          source_name: "myanimelist",
          source_user_id: username,
        })
        .select();

      if (insertError) {
        console.error("Error creating MAL source:", insertError);
        // Return more detailed error message
        const errorMessage = insertError.message || insertError.code || "Unknown database error";
        return NextResponse.json(
          { 
            error: "Failed to create MyAnimeList connection",
            details: errorMessage,
            code: insertError.code,
          },
          { status: 500 }
        );
      }
      
      console.log("Successfully created MAL source:", insertedData);
    }

    // Verify the source was created/updated successfully before syncing
    const { data: verifySource, error: verifyError } = await supabase
      .from("sources")
      .select("source_user_id")
      .eq("user_id", session.user.id)
      .eq("source_name", "myanimelist")
      .single();

    if (verifyError || !verifySource || !verifySource.source_user_id) {
      console.error("Error verifying MAL source:", verifyError);
      return NextResponse.json({
        success: true,
        message: "MyAnimeList connected, but sync failed. Please try syncing manually.",
        warning: true,
      });
    }

    // Sync data after connecting
    let syncResult = null;
    try {
      syncResult = await syncMALData(session.user.id);
    } catch (syncError: any) {
      console.error("Error syncing MAL data after connect:", syncError);
      const errorMessage = syncError?.message || "Unknown error";
      // Still return success, but mention sync issue with details
      return NextResponse.json({
        success: true,
        message: `MyAnimeList connected, but sync failed: ${errorMessage}. Please try syncing manually.`,
        warning: true,
        error: errorMessage,
      });
    }

    return NextResponse.json({
      success: true,
      message: `MyAnimeList connected successfully! Synced ${syncResult.animeImported} anime and ${syncResult.mangaImported} manga.`,
      animeImported: syncResult.animeImported,
      mangaImported: syncResult.mangaImported,
      errors: syncResult.errors,
    });
  } catch (error) {
    console.error("Error connecting MAL:", error);
    return NextResponse.json(
      { error: "Failed to connect MyAnimeList" },
      { status: 500 }
    );
  }
}
