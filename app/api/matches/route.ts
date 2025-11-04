import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const minScore = parseInt(searchParams.get("minScore") || "0");
    const offset = (page - 1) * limit;

    const userId = session.user.id;

    // Get matches for current user
    const { data: matches, count, error } = await supabase
      .from("matches")
      .select("*", { count: "exact" })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .gte("similarity_score", minScore)
      .order("similarity_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    // Fetch user data for all other users in matches
    const otherUserIds = new Set<string>();
    (matches || []).forEach((match: any) => {
      if (match.user1_id === userId) {
        otherUserIds.add(match.user2_id);
      } else {
        otherUserIds.add(match.user1_id);
      }
    });

    // Fetch all other users at once
    const { data: otherUsers } = await supabase
      .from("users")
      .select("id, username, avatar, bio")
      .in("id", Array.from(otherUserIds));

    const usersMap = new Map(
      (otherUsers || []).map((u) => [u.id, u])
    );

    // Enrich matches with user data
    const enrichedMatches = (matches || []).map((match: any) => {
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      const otherUser = usersMap.get(otherUserId) || {
        id: otherUserId,
        username: "unknown",
        avatar: undefined,
        bio: undefined,
      };

      return {
        id: match.id,
        similarity_score: match.similarity_score,
        shared_count: match.shared_count,
        created_at: match.created_at,
        updated_at: match.updated_at,
        otherUser,
      };
    });

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return NextResponse.json({
      matches: enrichedMatches,
      total: count || 0,
      page,
      totalPages,
      limit,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

