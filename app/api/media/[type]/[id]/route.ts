import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      );
    }

    const validTypes = ["anime", "manga", "book", "movie", "music"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const { data: media, error } = await supabase
      .from(type)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !media) {
      console.error(`Error fetching ${type}:`, error);
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Error in media fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
