import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get users the current user has already swiped on
    const { data: swipedUsers } = await supabase
      .from("blind_match_swipes")
      .select("target_user_email")
      .eq("user_email", session.user.email);

    const swipedEmails = new Set(
      (swipedUsers || []).map((s: any) => s.target_user_email)
    );

    // Get current user's taste profile
    const { data: myProfile } = await supabase
      .from("taste_profiles")
      .select("*")
      .eq("user_email", session.user.email)
      .single();

    if (!myProfile) {
      return NextResponse.json(
        { error: "Please complete your taste profile first" },
        { status: 400 }
      );
    }

    // Get other users' taste profiles (excluding already swiped)
    const { data: candidates } = await supabase
      .from("taste_profiles")
      .select("*")
      .neq("user_email", session.user.email)
      .limit(50);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ candidate: null });
    }

    // Filter and score candidates
    const myGenres = myProfile.top_genres || [];
    const myPersonality = {
      mainstream: myProfile.mainstream_score || 50,
      diversity: myProfile.diversity_score || 50,
      enthusiasm: myProfile.rating_average ? myProfile.rating_average * 10 : 50,
    };

    const scoredCandidates = candidates
      .filter((c: any) => !swipedEmails.has(c.user_email))
      .map((candidate: any) => {
        const theirGenres = candidate.top_genres || [];

        // Calculate genre overlap
        const sharedGenres = myGenres.filter((g: string) =>
          theirGenres.includes(g)
        );
        const genreScore =
          myGenres.length > 0
            ? (sharedGenres.length / myGenres.length) * 100
            : 0;

        // Calculate personality similarity
        const theirPersonality = {
          mainstream: candidate.mainstream_score || 50,
          diversity: candidate.diversity_score || 50,
          enthusiasm: candidate.rating_average
            ? candidate.rating_average * 10
            : 50,
        };

        const personalityDiff =
          Math.abs(myPersonality.mainstream - theirPersonality.mainstream) +
          Math.abs(myPersonality.diversity - theirPersonality.diversity) +
          Math.abs(myPersonality.enthusiasm - theirPersonality.enthusiasm);

        const personalityScore = Math.max(0, 100 - personalityDiff / 3);

        // Final compatibility score
        const compatibilityScore = Math.round(
          genreScore * 0.7 + personalityScore * 0.3
        );

        return {
          user_id: candidate.user_email,
          compatibility_score: compatibilityScore,
          shared_genres: sharedGenres.slice(0, 5),
          top_genres: theirGenres.slice(0, 5),
          personality_match: Math.round(personalityScore),
        };
      })
      .filter((c: any) => c.compatibility_score >= 50) // Only show 50%+ matches
      .sort((a: any, b: any) => b.compatibility_score - a.compatibility_score);

    if (scoredCandidates.length === 0) {
      return NextResponse.json({ candidate: null });
    }

    // Return best candidate
    return NextResponse.json({ candidate: scoredCandidates[0] });
  } catch (error) {
    console.error("Error getting next candidate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
