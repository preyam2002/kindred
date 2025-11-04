import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Goodreads source
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("source_name", "goodreads")
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "Goodreads not connected. Please upload a CSV file first." },
        { status: 404 }
      );
    }

    // For CSV-based sync, user needs to re-upload the CSV
    // This endpoint is kept for API compatibility
    return NextResponse.json({
      success: true,
      message: "Please upload a new CSV file to sync your Goodreads data. Go to Settings to upload.",
    });
  } catch (error) {
    console.error("Error syncing Goodreads:", error);
    return NextResponse.json(
      { error: "Failed to sync Goodreads data" },
      { status: 500 }
    );
  }
}
