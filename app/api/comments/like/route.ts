import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Toggle like (if exists, remove it; if not, add it)
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", comment_id)
      .eq("user_id", session.user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", comment_id)
        .eq("user_id", session.user.id);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        return NextResponse.json(
          { error: "Failed to remove like" },
          { status: 500 }
        );
      }

      // Decrement likes_count
      const { error: updateError } = await supabase.rpc("decrement_likes", {
        comment_id_param: comment_id,
      });

      if (updateError) {
        // Fallback: manually update
        const { data: comment } = await supabase
          .from("media_comments")
          .select("likes_count")
          .eq("id", comment_id)
          .single();

        await supabase
          .from("media_comments")
          .update({ likes_count: Math.max(0, (comment?.likes_count || 1) - 1) })
          .eq("id", comment_id);
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like
      const { error: insertError } = await supabase
        .from("comment_likes")
        .insert({
          comment_id,
          user_id: session.user.id,
        });

      if (insertError) {
        console.error("Error adding like:", insertError);
        return NextResponse.json(
          { error: "Failed to add like" },
          { status: 500 }
        );
      }

      // Increment likes_count
      const { error: updateError } = await supabase.rpc("increment_likes", {
        comment_id_param: comment_id,
      });

      if (updateError) {
        // Fallback: manually update
        const { data: comment } = await supabase
          .from("media_comments")
          .select("likes_count")
          .eq("id", comment_id)
          .single();

        await supabase
          .from("media_comments")
          .update({ likes_count: (comment?.likes_count || 0) + 1 })
          .eq("id", comment_id);
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error in comment like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
