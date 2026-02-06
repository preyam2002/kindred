import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/queue/[id] - Remove item from queue
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: itemId } = await params;

    // Check ownership
    const { data: item } = await supabase
      .from("queue_items")
      .select("user_id")
      .eq("id", itemId)
      .single();

    if (!item || item.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("queue_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Error removing from queue:", error);
      return NextResponse.json(
        { error: "Failed to remove from queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove from queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/queue/[id] - Update queue item (priority, notes, position)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: itemId } = await params;

    // Check ownership
    const { data: item } = await supabase
      .from("queue_items")
      .select("user_id")
      .eq("id", itemId)
      .single();

    if (!item || item.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { priority, notes, position } = body;

    const updates: { priority?: number; notes?: string; position?: number } = {};
    if (priority !== undefined) updates.priority = priority;
    if (notes !== undefined) updates.notes = notes;
    if (position !== undefined) updates.position = position;

    const { data: updated, error } = await supabase
      .from("queue_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating queue item:", error);
      return NextResponse.json(
        { error: "Failed to update queue item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Update queue item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
