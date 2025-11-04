import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { calculateMashScore } from "@/lib/matching";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's media stats
    const { data: userMedia, error: mediaError } = await supabase
      .from("user_media")
      .select("media_items(*)")
      .eq("user_id", userId);

    if (mediaError) {
      console.error("Error fetching user media:", mediaError);
    }

    const mediaCounts = {
      total: userMedia?.length || 0,
      books: userMedia?.filter((m: any) => m.media_items?.type === "book").length || 0,
      anime: userMedia?.filter((m: any) => m.media_items?.type === "anime").length || 0,
      manga: userMedia?.filter((m: any) => m.media_items?.type === "manga").length || 0,
      movies: userMedia?.filter((m: any) => m.media_items?.type === "movie").length || 0,
      music: userMedia?.filter((m: any) => m.media_items?.type === "music").length || 0,
    };

    // Get connected integrations
    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("source_name, created_at")
      .eq("user_id", userId);

    if (sourcesError) {
      console.error("Error fetching sources:", sourcesError);
    }

    // Get recent matches (top 5 by score)
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("similarity_score", { ascending: false })
      .limit(5);

    // Fetch user details for matches
    let enrichedMatches = [];
    if (matches && !matchesError) {
      for (const match of matches) {
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const { data: otherUser } = await supabase
          .from("users")
          .select("id, username, avatar")
          .eq("id", otherUserId)
          .single();
        
        enrichedMatches.push({
          ...match,
          otherUser: otherUser || { id: otherUserId, username: "unknown" },
        });
      }
    }

    // Get all users for potential matches (excluding current user)
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id, username, avatar")
      .neq("id", userId)
      .limit(20); // Limit for performance

    let suggestedMatches: any[] = [];

    if (allUsers && !usersError) {
      // Calculate matches for a few users (for suggestions)
      // For MVP, we'll just show a few users they haven't matched with yet
      const matchedUserIds = new Set(
        matches?.map((m: any) =>
          m.user1_id === userId ? m.user2_id : m.user1_id
        ) || []
      );

      const unmatchedUsers = allUsers.filter(
        (u: any) => !matchedUserIds.has(u.id)
      );

      // Calculate match for first 3 unmatched users
      const suggestions = [];
      for (const user of unmatchedUsers.slice(0, 3)) {
        try {
          const mashResult = await calculateMashScore(userId, user.id);
          suggestions.push({
            user,
            score: mashResult.score,
            sharedCount: mashResult.sharedCount,
          });
        } catch (error) {
          console.error(`Error calculating match for ${user.username}:`, error);
        }
      }

      // Sort by score and take top 3
      suggestedMatches = suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }

    // Get recent activity (recently added media)
    const { data: recentActivity, error: activityError } = await supabase
      .from("user_media")
      .select(
        `
        *,
        media_items(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (activityError) {
      console.error("Error fetching activity:", activityError);
    }

    return NextResponse.json({
      stats: {
        media: mediaCounts,
        integrations: sources?.length || 0,
        totalMatches: enrichedMatches.length,
      },
      recentMatches: enrichedMatches,
      suggestedMatches,
      recentActivity: recentActivity || [],
      connectedIntegrations: sources?.map((s: any) => s.source_name) || [],
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

