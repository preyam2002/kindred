import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/activity - Get activity feed (user's own + friends' activities)
export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, friends, own

    const supabase = createClient();

    let userIds: string[] = [];

    if (session?.user?.email) {
      // Get user ID
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .single();

      if (user) {
        userIds.push(user.id);

        // Get friends if filter is 'friends' or 'all'
        if (filter === "friends" || filter === "all") {
          const { data: friendships } = await supabase
            .from("friendships")
            .select("user_id, friend_id")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted");

          const friendIds = (friendships || []).map((f) =>
            f.user_id === user.id ? f.friend_id : f.user_id
          );

          if (filter === "friends") {
            userIds = friendIds; // Only friends
          } else {
            userIds = [...userIds, ...friendIds]; // Self + friends
          }
        }
      }
    }

    // Fetch activity feed
    let query = supabase
      .from("activity_feed")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (userIds.length > 0) {
      query = query.in("user_id", userIds);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error("Error fetching activity feed:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity feed" },
        { status: 500 }
      );
    }

    // Get user details for each activity
    const userIdsInActivities = [...new Set(activities?.map((a) => a.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, username, email, avatar")
      .in("id", userIdsInActivities);

    const activitiesWithUsers = (activities || []).map((activity) => ({
      ...activity,
      content: JSON.parse(activity.content),
      user: users?.find((u) => u.id === activity.user_id),
    }));

    return NextResponse.json({ activities: activitiesWithUsers });
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/activity - Create activity (for tracking user actions)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { activity_type, content, is_public } = body;

    if (!activity_type || !content) {
      return NextResponse.json(
        { error: "activity_type and content are required" },
        { status: 400 }
      );
    }

    const { data: activity, error } = await supabase
      .from("activity_feed")
      .insert({
        user_id: user.id,
        activity_type,
        content: JSON.stringify(content),
        is_public: is_public !== undefined ? is_public : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating activity:", error);
      return NextResponse.json(
        { error: "Failed to create activity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Create activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
