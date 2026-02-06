import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/friends/[id]/accept - Accept friend request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    const { id: friendshipId } = await params;

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
      .eq("id", friendshipId)
      .eq("friend_id", user.id)
      .eq("status", "pending")
      .single();

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    // Accept request
    const { error: acceptError } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (acceptError) {
      console.error("Error accepting friend request:", acceptError);
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
      actor_username: session.user.username || session.user.email,
      actor_avatar: session.user.image,
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
