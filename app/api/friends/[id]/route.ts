import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/friends/[id] - Reject friend request or remove friend
export async function DELETE(
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

    // Check if friendship exists and user is involved
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", params.id)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .single();

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 }
      );
    }

    // Delete the friendship
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error removing friendship:", error);
      return NextResponse.json(
        { error: "Failed to remove friendship" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove friendship error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
