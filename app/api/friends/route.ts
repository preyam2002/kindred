import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/friends - Get user's friends and pending requests
export async function GET() {
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

    // Get accepted friends (both directions)
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (friendshipsError) {
      console.error("Error fetching friends:", friendshipsError);
    }

    // Get pending requests received
    const { data: pendingReceived, error: pendingReceivedError } = await supabase
      .from("friendships")
      .select("*")
      .eq("friend_id", user.id)
      .eq("status", "pending");

    if (pendingReceivedError) {
      console.error("Error fetching pending requests:", pendingReceivedError);
    }

    // Get pending requests sent
    const { data: pendingSent, error: pendingSentError } = await supabase
      .from("friendships")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (pendingSentError) {
      console.error("Error fetching sent requests:", pendingSentError);
    }

    // Fetch user details for friends
    const friendIds = (friendships || []).map((f) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    const { data: friendUsers } = await supabase
      .from("users")
      .select("id, username, email, avatar")
      .in("id", friendIds);

    // Fetch user details for pending requests
    const pendingReceivedIds = (pendingReceived || []).map((r) => r.user_id);
    const pendingSentIds = (pendingSent || []).map((r) => r.friend_id);

    const { data: pendingReceivedUsers } = await supabase
      .from("users")
      .select("id, username, email, avatar")
      .in("id", pendingReceivedIds);

    const { data: pendingSentUsers } = await supabase
      .from("users")
      .select("id, username, email, avatar")
      .in("id", pendingSentIds);

    return NextResponse.json({
      friends: friendUsers || [],
      pendingReceived: (pendingReceived || []).map((req) => ({
        ...req,
        user: pendingReceivedUsers?.find((u) => u.id === req.user_id),
      })),
      pendingSent: (pendingSent || []).map((req) => ({
        ...req,
        user: pendingSentUsers?.find((u) => u.id === req.friend_id),
      })),
    });
  } catch (error) {
    console.error("Friends error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
