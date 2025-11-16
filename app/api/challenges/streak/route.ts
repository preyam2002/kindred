import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's streak record
    const { data: streakData, error: streakError } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_email", session.user.email)
      .single();

    if (streakError && streakError.code !== "PGRST116") {
      console.error("Streak error:", streakError);
    }

    // Get user's activity history to calculate streak
    const { data: activityData } = await supabase
      .from("library")
      .select("created_at, updated_at")
      .eq("user_email", session.user.email)
      .order("updated_at", { ascending: false })
      .limit(100);

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);
    const activityDates = new Set<string>();

    (activityData || []).forEach((item: any) => {
      const itemDate = new Date(item.updated_at || item.created_at);
      itemDate.setHours(0, 0, 0, 0);
      activityDates.add(itemDate.toISOString());
    });

    // Check consecutive days
    while (true) {
      const dateStr = checkDate.toISOString();
      if (activityDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified - would need historical data)
    const longestStreak = Math.max(
      currentStreak,
      streakData?.longest_streak || 0
    );

    // Calculate total points from completed challenges
    const { data: completedChallenges } = await supabase
      .from("user_challenge_progress")
      .select("points_earned")
      .eq("user_email", session.user.email)
      .eq("completed", true);

    const totalPoints =
      (completedChallenges || []).reduce(
        (sum: number, c: any) => sum + (c.points_earned || 0),
        0
      ) || streakData?.total_points || 0;

    // Calculate level (100 points per level)
    const level = Math.floor(totalPoints / 100) + 1;
    const nextLevelPoints = level * 100;

    // Update or create streak record
    const streakRecord = {
      user_email: session.user.email,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today.toISOString(),
      total_points: totalPoints,
      level: level,
    };

    if (streakData) {
      await supabase
        .from("user_streaks")
        .update(streakRecord)
        .eq("user_email", session.user.email);
    } else {
      await supabase.from("user_streaks").insert(streakRecord);
    }

    return NextResponse.json({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today.toISOString(),
      total_points: totalPoints,
      level,
      next_level_points: nextLevelPoints,
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
