import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log("[Integrations][GET] Session info", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId && !userEmail) {
      console.warn("[Integrations][GET] Unauthorized - missing user id and email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve user record by id first, then fall back to email
    let userIdToUse = userId;
    if (!userIdToUse && userEmail) {
      const { data: userByEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (!userByEmail) {
        console.warn("[Integrations][GET] User not found for email", { userEmail });
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userIdToUse = userByEmail.id;
    }

    if (!userIdToUse) {
      console.warn("[Integrations][GET] Unable to resolve user id", {
        userId,
        userEmail,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sources
    const { data: sources, error } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", userIdToUse);

    if (error) {
      console.error("[Integrations][GET] Error fetching sources", error);
      return NextResponse.json(
        { error: "Failed to fetch sources" },
        { status: 500 }
      );
    }

    console.log("[Integrations][GET] Returning sources", {
      count: sources?.length ?? 0,
    });
    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    console.error("[Integrations][GET] Unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

