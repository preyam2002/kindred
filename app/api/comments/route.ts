import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

// GET - Fetch comments for a media item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");
    const mediaType = searchParams.get("mediaType");

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: "Media ID and type are required" },
        { status: 400 }
      );
    }

    const { data: comments, error } = await supabase
      .from("media_comments")
      .select("*")
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Get user info for each comment
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, username")
      .in("id", userIds);

    const userMap = new Map(users?.map((u) => [u.id, u.username]) || []);

    // Enrich comments with usernames
    const enrichedComments = comments.map((comment) => ({
      ...comment,
      username: userMap.get(comment.user_id) || "Unknown",
    }));

    return NextResponse.json({ comments: enrichedComments });
  } catch (error) {
    console.error("Error in comments GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { media_id, media_type, content, rating, is_spoiler } = body;

    if (!media_id || !media_type || !content) {
      return NextResponse.json(
        { error: "Media ID, type, and content are required" },
        { status: 400 }
      );
    }

    // Upsert comment (update if exists, insert if new)
    const { data: comment, error } = await supabase
      .from("media_comments")
      .upsert(
        {
          user_id: session.user.id,
          media_id,
          media_type,
          content,
          rating: rating || null,
          is_spoiler: is_spoiler || false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,media_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Get username
    const { data: user } = await supabase
      .from("users")
      .select("username")
      .eq("id", session.user.id)
      .single();

    return NextResponse.json({
      comment: {
        ...comment,
        username: user?.username || "Unknown",
      },
    });
  } catch (error) {
    console.error("Error in comments POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("media_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in comments DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
