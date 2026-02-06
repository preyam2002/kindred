import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;

    const { data: challenge, error } = await supabase
      .from("taste_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (error || !challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: challenge.id,
      userId: challenge.user_email,
      username: challenge.username,
      items: challenge.items,
      createdAt: challenge.created_at,
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
