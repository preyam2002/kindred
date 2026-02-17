import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { calculateMashScore } from "@/lib/matching";
import { generateCompatibilityInsights } from "@/lib/insights";
import type { User } from "@/types/database";

interface UserDataResult {
  id: string;
  username: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user1: string; user2: string }> }
) {
  try {
    const session = await auth();
    const { user1: username1, user2: username2 } = await params;

    // Get user IDs from usernames
    const { data: user1Data } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username1)
      .single();

    const { data: user2Data } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username2)
      .single();

    if (!user1Data || !user2Data) {
      return NextResponse.json(
        { error: "One or both users not found" },
        { status: 404 }
      );
    }

    // Calculate mash score
    const mashResult = await calculateMashScore(user1Data.id, user2Data.id);

    // Generate insights
    const insights = await generateCompatibilityInsights(
      user1Data as unknown as User,
      user2Data as unknown as User,
      mashResult
    );

    return NextResponse.json({
      insights,
      mashScore: mashResult.score,
      sharedCount: mashResult.sharedCount,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}






