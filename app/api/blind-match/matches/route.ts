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

    // Get matches where user is either user1 or user2
    const { data: matches, error } = await supabase
      .from("blind_matches")
      .select("*")
      .or(`user1_email.eq.${session.user.email},user2_email.eq.${session.user.email}`)
      .order("matched_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error);
      return NextResponse.json(
        { error: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    // Format matches
    const formattedMatches = (matches || []).map((match: any) => {
      const otherUserEmail =
        match.user1_email === session.user.email
          ? match.user2_email
          : match.user1_email;

      return {
        id: match.id,
        compatibility_score: match.compatibility_score,
        shared_genres: match.shared_genres || [],
        shared_favorites_count: (match.shared_genres || []).length,
        chat_unlocked: match.chat_unlocked,
        profile_revealed: match.profile_revealed,
        username: match.profile_revealed ? otherUserEmail.split("@")[0] : null,
        match_date: match.matched_at,
      };
    });

    return NextResponse.json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
