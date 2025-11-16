import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's challenges
    const { data: challenges, error } = await supabase
      .from("taste_challenges")
      .select("*")
      .eq("user_email", session.user.email)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching challenges:", error);
      return NextResponse.json(
        { error: "Failed to fetch challenges" },
        { status: 500 }
      );
    }

    // Format challenges for response
    const formattedChallenges = (challenges || []).map((challenge: any) => ({
      id: challenge.id,
      username: challenge.username,
      items: challenge.items || [],
      createdAt: challenge.created_at,
      expiresAt: challenge.expires_at,
      isActive: new Date(challenge.expires_at) > new Date(),
    }));

    return NextResponse.json({
      challenges: formattedChallenges,
    });
  } catch (error) {
    console.error("Error in list challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
