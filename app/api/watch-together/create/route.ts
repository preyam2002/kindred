import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_collaborative, is_public } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    const { data: collection, error } = await supabase
      .from("cross_media_collections")
      .insert({
        user_id: session.user.email,
        name: name.trim(),
        description: description?.trim() || null,
        is_collaborative: Boolean(is_collaborative),
        is_public: Boolean(is_public),
        item_count: 0,
        follower_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      return NextResponse.json(
        { error: "Failed to create collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
