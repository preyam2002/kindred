import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { target_user_id, liked } = body;

    if (!target_user_id || liked === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Record the swipe
    await supabase.from("blind_match_swipes").insert({
      user_email: session.user.email,
      target_user_email: target_user_id,
      liked,
      swiped_at: new Date().toISOString(),
    });

    if (!liked) {
      return NextResponse.json({ matched: false });
    }

    // Check if target user also liked us
    const { data: reciprocalSwipe } = await supabase
      .from("blind_match_swipes")
      .select("*")
      .eq("user_email", target_user_id)
      .eq("target_user_email", session.user.email)
      .eq("liked", true)
      .single();

    if (reciprocalSwipe) {
      // It's a match! Create match record
      const { data: tasteProfiles } = await supabase
        .from("taste_profiles")
        .select("*")
        .in("user_email", [session.user.email, target_user_id]);

      const myProfile = tasteProfiles?.find(
        (p: any) => p.user_email === session.user.email
      );
      const theirProfile = tasteProfiles?.find(
        (p: any) => p.user_email === target_user_id
      );

      const myGenres = myProfile?.top_genres || [];
      const theirGenres = theirProfile?.top_genres || [];
      const sharedGenres = myGenres.filter((g: string) =>
        theirGenres.includes(g)
      );

      const compatibilityScore =
        myGenres.length > 0
          ? Math.round((sharedGenres.length / myGenres.length) * 100)
          : 50;

      // Create match record for both users
      const matchData = {
        user1_email: session.user.email,
        user2_email: target_user_id,
        compatibility_score: compatibilityScore,
        shared_genres: sharedGenres,
        chat_unlocked: false,
        profile_revealed: false,
        matched_at: new Date().toISOString(),
      };

      await supabase.from("blind_matches").insert(matchData);

      return NextResponse.json({ matched: true, match: matchData });
    }

    return NextResponse.json({ matched: false });
  } catch (error) {
    console.error("Error processing swipe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
