import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { calculateMashScore } from "@/lib/matching";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const minSimilarity = parseInt(searchParams.get("minSimilarity") || "0");
    const sortBy = searchParams.get("sort") || "username"; // username, similarity, recent

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const offset = (page - 1) * limit;

    let usersQuery = supabase
      .from("users")
      .select("id, username, avatar, bio, created_at", { count: "exact" })
      .neq("id", currentUserId);

    // Search by username if query provided
    if (query) {
      usersQuery = usersQuery.ilike("username", `%${query}%`);
    }

    // Get total count first for pagination
    const { count, data: users, error } = await usersQuery
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: "Failed to search users" },
        { status: 500 }
      );
    }

    // If sorting by similarity, calculate matches for each user
    let enrichedUsers = users || [];
    if (sortBy === "similarity" && users && users.length > 0) {
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          try {
            const mashResult = await calculateMashScore(currentUserId, user.id);
            return {
              ...user,
              similarityScore: mashResult.score,
              sharedCount: mashResult.sharedCount,
            };
          } catch (error) {
            console.error(`Error calculating match for ${user.username}:`, error);
            return {
              ...user,
              similarityScore: 0,
              sharedCount: 0,
            };
          }
        })
      );

      // Filter by minimum similarity
      let filtered = usersWithScores;
      if (minSimilarity > 0) {
        filtered = usersWithScores.filter(
          (u) => (u.similarityScore || 0) >= minSimilarity
        );
      }

      // Sort by similarity score
      enrichedUsers = filtered.sort(
        (a, b) => b.similarityScore - a.similarityScore
      );
    } else if (sortBy === "username") {
      // Sort by username alphabetically
      enrichedUsers = users.sort((a, b) =>
        a.username.localeCompare(b.username)
      );
    } else if (sortBy === "recent") {
      enrichedUsers = users.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return NextResponse.json({
      users: enrichedUsers,
      total: count || enrichedUsers.length,
      page,
      totalPages,
      limit,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error("Error in user search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

