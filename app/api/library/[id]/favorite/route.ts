import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { is_favorite } = body;

    // Validate is_favorite
    if (typeof is_favorite !== "boolean") {
      return NextResponse.json(
        { error: "Invalid is_favorite value (must be boolean)" },
        { status: 400 }
      );
    }

    // Update the favorite status
    const { data, error } = await supabase
      .from("user_media")
      .update({
        is_favorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id) // Ensure user owns this item
      .select()
      .single();

    if (error) {
      console.error("Error updating favorite:", error);
      return NextResponse.json(
        { error: "Failed to update favorite" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in favorite update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
