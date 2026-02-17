import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { syncMALData } from "@/lib/integrations/myanimelist";
import { supabase } from "@/lib/db/supabase";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get MAL source
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("source_name", "myanimelist")
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "MyAnimeList not connected" },
        { status: 404 }
      );
    }

    if (!source.source_user_id) {
      return NextResponse.json(
        { error: "MyAnimeList username not found" },
        { status: 400 }
      );
    }

    // Sync data (no OAuth token needed for public lists)
    const result = await syncMALData(session.user.id);

    return NextResponse.json({
      success: true,
      message: `Synced ${result.animeImported} anime and ${result.mangaImported} manga${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
      animeImported: result.animeImported,
      mangaImported: result.mangaImported,
      errors: result.errors,
    });
  } catch {
    console.error("Error syncing MAL:");
    return NextResponse.json(
      { error: "Failed to sync MyAnimeList data" },
      { status: 500 }
    );
  }
}






