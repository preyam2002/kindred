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
    const { progress, progress_total } = body;

    // Validate progress
    if (progress !== undefined && (typeof progress !== "number" || progress < 0)) {
      return NextResponse.json(
        { error: "Invalid progress value" },
        { status: 400 }
      );
    }

    if (progress_total !== undefined && (typeof progress_total !== "number" || progress_total < 0)) {
      return NextResponse.json(
        { error: "Invalid progress_total value" },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (progress !== undefined) {
      updates.progress = progress;
    }

    if (progress_total !== undefined) {
      updates.progress_total = progress_total;
    }

    // Update the progress
    const { data, error } = await supabase
      .from("user_media")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id) // Ensure user owns this item
      .select()
      .single();

    if (error) {
      console.error("Error updating progress:", error);
      return NextResponse.json(
        { error: "Failed to update progress" },
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
    console.error("Error in progress update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
