import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

interface MatchUpdateData {
  user1_status?: string;
  user2_status?: string;
  matched_at?: string;
  updated_at: string;
}

interface MatchInsertData {
  user1_id: string;
  user2_id: string;
  user1_status: string;
  user2_status: string;
  compatibility_score: number;
  shared_items_count: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { target_user_id, action } = body;

    if (!target_user_id || !action) {
      return NextResponse.json(
        { error: "Missing target_user_id or action" },
        { status: 400 }
      );
    }

    if (!["like", "pass"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action (must be 'like' or 'pass')" },
        { status: 400 }
      );
    }

    // Ensure we have a consistent ordering for user pairs (user1 < user2)
    const [user1_id, user2_id] =
      userId < target_user_id
        ? [userId, target_user_id]
        : [target_user_id, userId];

    const isUser1 = userId === user1_id;

    // Check if a match record already exists
    const { data: existingMatch, error: matchError } = await supabase
      .from("taste_matches")
      .select("*")
      .eq("user1_id", user1_id)
      .eq("user2_id", user2_id)
      .single();

    const status = action === "like" ? "liked" : "passed";

    if (existingMatch) {
      // Update existing match
      const updateData: MatchUpdateData = { updated_at: new Date().toISOString() };

      if (isUser1) {
        updateData.user1_status = status;
      } else {
        updateData.user2_status = status;
      }

      // Check if both have liked (it's a match!)
      const user1Status = isUser1 ? status : existingMatch.user1_status;
      const user2Status = isUser1 ? existingMatch.user2_status : status;

      const isMatch = user1Status === "liked" && user2Status === "liked";
      if (isMatch && !existingMatch.matched_at) {
        updateData.matched_at = new Date().toISOString();
      }

      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("taste_matches")
        .update(updateData)
        .eq("user1_id", user1_id)
        .eq("user2_id", user2_id);

      if (updateError) {
        console.error("Error updating match:", updateError);
        return NextResponse.json(
          { error: "Failed to update match" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        matched: isMatch,
      });
    } else {
      // Create new match record
      const insertData: MatchInsertData = {
        user1_id,
        user2_id,
        user1_status: isUser1 ? status : "pending",
        user2_status: isUser1 ? "pending" : status,
        compatibility_score: 0, // Will be computed later
        shared_items_count: 0, // Will be computed later
      };

      const { error: insertError } = await supabase
        .from("taste_matches")
        .insert(insertData);

      if (insertError) {
        console.error("Error creating match:", insertError);
        return NextResponse.json(
          { error: "Failed to create match" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        matched: false,
      });
    }
  } catch (error) {
    console.error("Error in taste match action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
