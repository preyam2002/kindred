import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/collections - Get all collections (user's own + public)
export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Optional: get collections by specific user

    const supabase = createClient();

    let query = supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      // Get collections by specific user
      query = query.eq("user_id", userId);
      if (!session?.user?.email || session.user.id !== userId) {
        // Only show public collections if not the owner
        query = query.eq("is_public", true);
      }
    } else if (session?.user?.id) {
      // Get user's own collections + public collections from others
      query = query.or(`user_id.eq.${session.user.id},is_public.eq.true`);
    } else {
      // Not logged in - only show public collections
      query = query.eq("is_public", true);
    }

    const { data: collections, error } = await query.limit(50);

    if (error) {
      console.error("Error fetching collections:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collections: collections || [] });
  } catch (error) {
    console.error("Collections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();

    // Get user ID from email
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, is_public, is_collaborative } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const { data: collection, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        is_public: is_public !== undefined ? is_public : true,
        is_collaborative: is_collaborative || false,
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

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
