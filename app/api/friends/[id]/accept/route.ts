import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/friends/[id]/accept - Accept friend request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

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

    // Check if request exists and user is the recipient
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", params.id)
      .eq("friend_id", user.id)
      .eq("status", "pending")
      .single();

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    // Accept the request
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) {
      console.error("Error accepting friend request:", error);
      return NextResponse.json(
        { error: "Failed to accept friend request" },
        { status: 500 }
      );
    }

    // Create notification for requester
    await supabase.from("notifications").insert({
      user_id: friendship.user_id,
      type: "friend",
      title: "Friend Request Accepted",
      message: `${session.user.username || session.user.email} accepted your friend request`,
      link: "/friends",
      is_read: false,
      actor_id: user.id,
      actor_username: session.user.username,
      actor_avatar: session.user.avatar,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
