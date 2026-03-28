import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// GET /api/settings - Get user settings (privacy, notifications)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    const { data: user } = await supabase
      .from("users")
      .select("id, is_public, show_email, show_library, email_notifications, match_notifications, challenge_notifications, comment_notifications, streak_reminders")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      privacy: {
        isProfilePublic: user.is_public ?? true,
        showEmail: user.show_email ?? false,
        showLibrary: user.show_library ?? true,
      },
      notifications: {
        emailNotifications: user.email_notifications ?? true,
        matchNotifications: user.match_notifications ?? true,
        challengeNotifications: user.challenge_notifications ?? true,
        commentNotifications: user.comment_notifications ?? true,
        streakReminders: user.streak_reminders ?? true,
      },
    });
  } catch (error) {
    logger.error("Error fetching settings", "settings", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { section } = body; // "privacy" or "notifications"

    const supabase = createClient();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (section === "privacy") {
      const { isProfilePublic, showEmail, showLibrary } = body;
      const { error } = await supabase
        .from("users")
        .update({
          is_public: isProfilePublic,
          show_email: showEmail,
          show_library: showLibrary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        logger.error("Error saving privacy settings", "settings", error);
        return NextResponse.json({ error: "Failed to save privacy settings" }, { status: 500 });
      }

      return NextResponse.json({ message: "Privacy settings saved" });
    }

    if (section === "notifications") {
      const { emailNotifications, matchNotifications, challengeNotifications, commentNotifications, streakReminders } = body;
      const { error } = await supabase
        .from("users")
        .update({
          email_notifications: emailNotifications,
          match_notifications: matchNotifications,
          challenge_notifications: challengeNotifications,
          comment_notifications: commentNotifications,
          streak_reminders: streakReminders,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        logger.error("Error saving notification settings", "settings", error);
        return NextResponse.json({ error: "Failed to save notification settings" }, { status: 500 });
      }

      return NextResponse.json({ message: "Notification settings saved" });
    }

    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  } catch (error) {
    logger.error("Error updating settings", "settings", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/settings/account - Delete user account
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user data in order (respecting foreign key constraints)
    const userId = user.id;
    const userEmail = session.user.email;

    // Delete related data
    await supabase.from("queue_votes").delete().eq("user_id", userId);
    await supabase.from("queue_items").delete().eq("user_id", userId);
    await supabase.from("notifications").delete().eq("user_id", userId);
    await supabase.from("messages").delete().in(
      "conversation_id",
      (await supabase.from("conversations").select("id").eq("user_id", userId)).data?.map((c) => c.id) || []
    );
    await supabase.from("conversations").delete().eq("user_id", userId);
    await supabase.from("blind_match_swipes").delete().eq("user_id", userId);
    await supabase.from("media_comments").delete().eq("user_email", userEmail);
    await supabase.from("collection_items").delete().in(
      "collection_id",
      (await supabase.from("collections").select("id").eq("user_id", userId)).data?.map((c) => c.id) || []
    );
    await supabase.from("collections").delete().eq("user_id", userId);
    await supabase.from("activity_feed").delete().eq("user_id", userId);
    await supabase.from("matches").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    await supabase.from("friendships").delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    await supabase.from("user_media").delete().eq("user_id", userId);
    await supabase.from("sources").delete().eq("user_id", userId);
    await supabase.from("taste_profiles").delete().eq("user_email", userEmail);
    await supabase.from("user_streaks").delete().eq("user_email", userEmail);

    // Finally delete the user
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      logger.error("Error deleting user account", "settings", error);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    logger.info(`Account deleted: ${userId}`, "settings");
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    logger.error("Error deleting account", "settings", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
