import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// GET /api/settings/export - Export all user data (GDPR compliance)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    const userEmail = session.user.email;

    // Gather all user data
    const [
      { data: userMedia },
      { data: sources },
      { data: matches },
      { data: friendships },
      { data: collections },
      { data: queueItems },
      { data: notifications },
      { data: activities },
      { data: comments },
      { data: tasteProfile },
      { data: streaks },
    ] = await Promise.all([
      supabase.from("user_media").select("*").eq("user_id", userId),
      supabase.from("sources").select("source_name, source_user_id, created_at").eq("user_id", userId),
      supabase.from("matches").select("*").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from("friendships").select("*").or(`user_id.eq.${userId},friend_id.eq.${userId}`),
      supabase.from("collections").select("*").eq("user_id", userId),
      supabase.from("queue_items").select("*").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
      supabase.from("activity_feed").select("*").eq("user_id", userId),
      supabase.from("media_comments").select("*").eq("user_email", userEmail),
      supabase.from("taste_profiles").select("*").eq("user_email", userEmail).single(),
      supabase.from("user_streaks").select("*").eq("user_email", userEmail).single(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        createdAt: user.created_at,
      },
      library: userMedia || [],
      connectedSources: sources || [],
      matches: matches || [],
      friendships: friendships || [],
      collections: collections || [],
      queue: queueItems || [],
      notifications: notifications || [],
      activities: activities || [],
      comments: comments || [],
      tasteProfile: tasteProfile || null,
      streaks: streaks || null,
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="kindred-export-${user.username}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error("Error exporting user data", "settings/export", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
