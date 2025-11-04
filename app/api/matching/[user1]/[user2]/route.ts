import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { getOrCreateMatch, calculateMashScore } from "@/lib/matching";
import { NotFoundError, formatErrorResponse, withRetry } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user1: string; user2: string }> }
) {
  try {
    const { user1, user2 } = await params;

    // Validate usernames
    if (!user1 || !user2) {
      return NextResponse.json(
        formatErrorResponse(new NotFoundError("User", "username required")),
        { status: 404 }
      );
    }

    // Fetch both users with retry
    const [user1Data, user2Data] = await Promise.all([
      withRetry(async () => {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", user1)
          .single();

        if (error || !data) {
          throw new NotFoundError("User", user1);
        }
        return data;
      }),
      withRetry(async () => {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", user2)
          .single();

        if (error || !data) {
          throw new NotFoundError("User", user2);
        }
        return data;
      }),
    ]);

    // Get or create match with retry
    const match = await withRetry(() =>
      getOrCreateMatch(user1Data.id, user2Data.id)
    );

    // Calculate detailed mash result with retry
    const mashResult = await withRetry(() =>
      calculateMashScore(user1Data.id, user2Data.id)
    );

    return NextResponse.json({
      user1: user1Data,
      user2: user2Data,
      match,
      mashResult,
    });
  } catch (error) {
    console.error("Error in matching:", error);
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as any).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

