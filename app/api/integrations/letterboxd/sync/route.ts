import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Letterboxd source
    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("source_name", "letterboxd")
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: "Letterboxd not connected. Please upload a CSV file first." },
        { status: 404 }
      );
    }

    // For CSV-based sync, user needs to re-upload the CSV
    return NextResponse.json({
      success: true,
      message: "Please upload a new CSV file to sync your Letterboxd data. Go to Settings to upload.",
    });
  } catch (error) {
    console.error("Error syncing Letterboxd:", error);
    return NextResponse.json(
      { error: "Failed to sync Letterboxd data" },
      { status: 500 }
    );
  }
}





