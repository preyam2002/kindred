import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    logger.info("Session info", "integrations", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId && !userEmail) {
      logger.warn("Unauthorized - missing user id and email", "integrations");
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
        logger.warn("User not found for email", "integrations", { userEmail });
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userIdToUse = userByEmail.id;
    }

    if (!userIdToUse) {
      logger.warn("Unable to resolve user id", "integrations", {
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
      logger.error("Error fetching sources", "integrations", error);
      return NextResponse.json(
        { error: "Failed to fetch sources" },
        { status: 500 }
      );
    }

    logger.info("Returning sources", "integrations", {
      count: sources?.length ?? 0,
    });
    return NextResponse.json({ sources: sources || [] });
  } catch (error) {
    logger.error("Unexpected error", "integrations", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

