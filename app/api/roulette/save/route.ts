import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { media_id, media_type, notes } = body;

    if (!media_id || !media_type) {
      return NextResponse.json(
        { error: "Media ID and type are required" },
        { status: 400 }
      );
    }

    // Save to a "saved_recommendations" table or add to library with special status
    const { data, error } = await supabase
      .from("saved_recommendations")
      .insert({
        user_email: session.user.email,
        media_id,
        media_type,
        notes: notes || "From Recommendation Roulette",
        source: "roulette",
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, just add to library with rating 0 (watchlist)
      const { data: libraryAdd, error: libError } = await supabase
        .from("library")
        .insert({
          user_email: session.user.email,
          media_id,
          rating: 0, // 0 means "want to watch/read"
        })
        .select()
        .single();

      if (libError) {
        console.error("Error saving recommendation:", libError);
        return NextResponse.json(
          { error: "Failed to save recommendation" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        saved: libraryAdd,
        message: "Added to your library!"
      });
    }

    return NextResponse.json({
      success: true,
      saved: data,
      message: "Saved for later!"
    });
  } catch (error) {
    console.error("Error saving recommendation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
