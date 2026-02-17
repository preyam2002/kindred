import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  label: string;
  extra?: string;
}

interface UserMediaItem {
  user_id: string;
}

interface TasteProfile {
  user_email: string;
  diversity_score?: number;
  top_genres?: string[];
  rating_average?: number;
}

interface UserStreak {
  user_email: string;
  current_streak?: number;
  longest_streak?: number;
  level?: number;
  total_points?: number;
}

interface UserRecord {
  id: string;
  username: string;
  email?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "top_raters";
    const period = searchParams.get("period") || "all_time"; // all_time, monthly, weekly

    let leaderboard: LeaderboardEntry[] = [];

    // Calculate date range for period
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "weekly") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    }

    switch (category) {
      case "top_raters":
        // Users with most ratings
        const { data: topRaters } = await supabase
          .from("user_media")
          .select("user_id")
          .gte("created_at", startDate.toISOString());

        if (topRaters) {
          const userCounts = new Map<string, number>();
          topRaters.forEach((item: UserMediaItem) => {
            userCounts.set(item.user_id, (userCounts.get(item.user_id) || 0) + 1);
          });

          const sortedUsers = Array.from(userCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 100);

          const userIds = sortedUsers.map(([userId]) => userId);
          const { data: users } = await supabase
            .from("users")
            .select("id, username")
            .in("id", userIds);

          const userMap = new Map(users?.map((u: UserRecord) => [u.id, u.username]) || []);

          leaderboard = sortedUsers.map(([userId, count], index) => ({
            rank: index + 1,
            user_id: userId,
            username: userMap.get(userId) || "Unknown",
            score: count,
            label: "ratings",
          }));
        }
        break;

      case "diversity":
        // Users with most diverse taste (unique genres)
        const { data: profiles } = await supabase
          .from("taste_profiles")
          .select("user_email, diversity_score, top_genres")
          .order("diversity_score", { ascending: false })
          .limit(100);

        if (profiles) {
          const { data: users } = await supabase
            .from("users")
            .select("id, username, email")
            .in(
              "email",
              profiles.map((p: TasteProfile) => p.user_email)
            );

          const userMap = new Map(users?.map((u: UserRecord) => [u.email, u]) || []);

          leaderboard = profiles
            .map((profile: TasteProfile, index: number) => {
              const user = userMap.get(profile.user_email);
              if (!user) return null;

              return {
                rank: index + 1,
                user_id: user.id,
                username: user.username,
                score: profile.diversity_score || 0,
                label: "diversity",
                extra: `${(profile.top_genres || []).length} genres`,
              };
            })
            .filter(Boolean) as LeaderboardEntry[];
        }
        break;

      case "streak_champions":
        // Users with longest current streaks
        const { data: streaks } = await supabase
          .from("user_streaks")
          .select("user_email, current_streak, longest_streak, level")
          .order("current_streak", { ascending: false })
          .limit(100);

        if (streaks) {
          const { data: users } = await supabase
            .from("users")
            .select("id, username, email")
            .in(
              "email",
              streaks.map((s: UserStreak) => s.user_email)
            );

          const userMap = new Map(users?.map((u: UserRecord) => [u.email, u]) || []);

          leaderboard = streaks
            .map((streak: UserStreak, index: number) => {
              const user = userMap.get(streak.user_email);
              if (!user) return null;

              return {
                rank: index + 1,
                user_id: user.id,
                username: user.username,
                score: streak.current_streak || 0,
                label: "day streak",
                extra: `Level ${streak.level || 1}`,
              };
            })
            .filter(Boolean) as LeaderboardEntry[];
        }
        break;

      case "genre_experts":
        // Users with highest average rating in specific genres
        const genre = searchParams.get("genre") || "Action";

        const { data: genreExperts } = await supabase
          .from("taste_profiles")
          .select("user_email, rating_average, top_genres")
          .contains("top_genres", [genre])
          .order("rating_average", { ascending: false })
          .limit(100);

        if (genreExperts) {
          const { data: users } = await supabase
            .from("users")
            .select("id, username, email")
            .in(
              "email",
              genreExperts.map((p: TasteProfile) => p.user_email)
            );

          const userMap = new Map(users?.map((u: UserRecord) => [u.email, u]) || []);

          leaderboard = genreExperts
            .map((profile: TasteProfile, index: number) => {
              const user = userMap.get(profile.user_email);
              if (!user) return null;

              return {
                rank: index + 1,
                user_id: user.id,
                username: user.username,
                score: profile.rating_average || 0,
                label: "avg rating",
                extra: `${genre} expert`,
              };
            })
            .filter(Boolean) as LeaderboardEntry[];
        }
        break;

      case "points":
        // Users with most total points
        const { data: points } = await supabase
          .from("user_streaks")
          .select("user_email, total_points, level")
          .order("total_points", { ascending: false })
          .limit(100);

        if (points) {
          const { data: users } = await supabase
            .from("users")
            .select("id, username, email")
            .in(
              "email",
              points.map((p: UserStreak) => p.user_email)
            );

          const userMap = new Map(users?.map((u: UserRecord) => [u.email, u]) || []);

          leaderboard = points
            .map((item: UserStreak, index: number) => {
              const user = userMap.get(item.user_email);
              if (!user) return null;

              return {
                rank: index + 1,
                user_id: user.id,
                username: user.username,
                score: item.total_points || 0,
                label: "points",
                extra: `Level ${item.level || 1}`,
              };
            })
            .filter(Boolean) as LeaderboardEntry[];
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Add current user's rank if not in top 100
    const currentUserId = session.user.id;
    const userRankIndex = leaderboard.findIndex((item) => item.user_id === currentUserId);

    return NextResponse.json({
      category,
      period,
      leaderboard,
      user_rank: userRankIndex >= 0 ? userRankIndex + 1 : null,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
