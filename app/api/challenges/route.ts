import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get user's progress for today's challenges
    const { data: userProgress } = await supabase
      .from("user_challenge_progress")
      .select("*")
      .eq("user_email", session.user.email)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    const progressMap = new Map(
      (userProgress || []).map((p: any) => [p.challenge_id, p])
    );

    // Get user's library stats for dynamic challenge progress
    const { data: libraryItems } = await supabase
      .from("library")
      .select("rating, created_at, updated_at")
      .eq("user_email", session.user.email);

    const todayRatings = (libraryItems || []).filter((item: any) => {
      const itemDate = new Date(item.updated_at || item.created_at);
      return itemDate >= today && itemDate < tomorrow;
    });

    const highRatingsToday = todayRatings.filter(
      (item: any) => item.rating && item.rating >= 8
    ).length;

    // Define daily challenges
    const baseChallenges = [
      {
        id: "daily_rate_5",
        title: "Daily Explorer",
        description: "Rate 5 items today",
        type: "rating",
        target: 5,
        current_progress: todayRatings.length,
        reward_points: 50,
        icon: "target",
      },
      {
        id: "daily_high_rating",
        title: "Find Gems",
        description: "Give 3 items a rating of 8 or higher",
        type: "high_rating",
        target: 3,
        current_progress: highRatingsToday,
        reward_points: 75,
        icon: "star",
      },
      {
        id: "daily_diversity",
        title: "Diverse Palette",
        description: "Rate items from 3 different media types",
        type: "diversity",
        target: 3,
        current_progress: calculateDiversity(todayRatings),
        reward_points: 100,
        icon: "trending",
      },
    ];

    // Add weekend bonus challenge
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseChallenges.push({
        id: "weekend_marathon",
        title: "Weekend Marathon",
        description: "Rate 10 items this weekend",
        type: "weekend",
        target: 10,
        current_progress: todayRatings.length,
        reward_points: 150,
        icon: "trophy",
      });
    }

    // Mark completed challenges
    const challenges = baseChallenges.map((challenge) => {
      const progress = progressMap.get(challenge.id);
      const completed =
        progress?.completed || challenge.current_progress >= challenge.target;

      return {
        ...challenge,
        completed,
        expires_at: tomorrow.toISOString(),
      };
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateDiversity(items: any[]): number {
  const types = new Set<string>();

  // This would need to check the actual media types from joined data
  // For now, return a placeholder
  return Math.min(3, items.length > 0 ? 1 : 0);
}
