import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/friends/request - Send friend request
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
    const { friend_id } = body;

    if (!friend_id) {
      return NextResponse.json(
        { error: "friend_id is required" },
        { status: 400 }
      );
    }

    // Can't friend yourself
    if (friend_id === user.id) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    // Check if friendship already exists (either direction)
    const { data: existing } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json(
          { error: "Already friends" },
          { status: 409 }
        );
      } else if (existing.status === "pending") {
        return NextResponse.json(
          { error: "Friend request already sent" },
          { status: 409 }
        );
      }
    }

    // Create friend request
    const { data: friendship, error } = await supabase
      .from("friendships")
      .insert({
        user_id: user.id,
        friend_id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating friend request:", error);
      return NextResponse.json(
        { error: "Failed to send friend request" },
        { status: 500 }
      );
    }

    // Create notification for the recipient
    await supabase.from("notifications").insert({
      user_id: friend_id,
      type: "system",
      title: "New Friend Request",
      message: `${session.user.username || session.user.email} sent you a friend request`,
      link: "/friends",
      is_read: false,
      actor_id: user.id,
      actor_username: session.user.username,
      actor_avatar: session.user.image,
    });

    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
