import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateMashScore } from "@/lib/matching";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout for Vercel

/**
 * POST /api/cron/calculate-matches
 * Background job to pre-calculate match scores for all user pairs.
 * Intended to be called by Vercel Cron or external scheduler.
 * Requires CRON_SECRET header for authorization.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const startTime = Date.now();

  try {
    // Get all users with media
    const { data: usersWithMedia, error: usersError } = await supabase
      .from("user_media")
      .select("user_id")
      .limit(1000);

    if (usersError || !usersWithMedia) {
      logger.error("Failed to fetch users for match calculation", "cron", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Get unique user IDs
    const userIds = [...new Set(usersWithMedia.map((um) => um.user_id))];
    logger.info(`Starting match calculation for ${userIds.length} users`, "cron");

    // Get existing matches to know which need recalculation
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: staleMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .lt("updated_at", staleThreshold);

    const staleSet = new Set(
      (staleMatches || []).map((m) => [m.user1_id, m.user2_id].sort().join(":"))
    );

    // Get pairs that need calculation (stale or missing)
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id, updated_at");

    const existingSet = new Set(
      (existingMatches || []).map((m) => [m.user1_id, m.user2_id].sort().join(":"))
    );

    // Build pairs to calculate - prioritize stale matches and new pairs
    const pairsToCalculate: [string, string][] = [];

    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const pairKey = [userIds[i], userIds[j]].sort().join(":");
        if (!existingSet.has(pairKey) || staleSet.has(pairKey)) {
          pairsToCalculate.push([userIds[i], userIds[j]]);
        }
      }
    }

    // Limit batch size to prevent timeout
    const batchSize = Math.min(pairsToCalculate.length, 100);
    const batch = pairsToCalculate.slice(0, batchSize);

    let calculated = 0;
    let errors = 0;

    for (const [user1Id, user2Id] of batch) {
      try {
        const result = await calculateMashScore(user1Id, user2Id);

        // Upsert match
        const { error } = await supabase
          .from("matches")
          .upsert(
            {
              user1_id: user1Id,
              user2_id: user2Id,
              similarity_score: result.score,
              shared_count: result.sharedCount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user1_id,user2_id" }
          );

        if (error) {
          errors++;
          logger.error(`Match calc failed for ${user1Id}/${user2Id}`, "cron", error);
        } else {
          calculated++;
        }
      } catch (error) {
        errors++;
        logger.error(`Match calc error for ${user1Id}/${user2Id}`, "cron", error);
      }
    }

    const duration = Date.now() - startTime;

    logger.info(
      `Match calculation complete: ${calculated} calculated, ${errors} errors, ${duration}ms`,
      "cron"
    );

    return NextResponse.json({
      message: "Match calculation complete",
      stats: {
        totalUsers: userIds.length,
        totalPairsNeeded: pairsToCalculate.length,
        batchSize,
        calculated,
        errors,
        durationMs: duration,
      },
    });
  } catch (error) {
    logger.error("Cron match calculation failed", "cron", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
