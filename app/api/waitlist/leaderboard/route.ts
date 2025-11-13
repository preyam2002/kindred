import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

// GET - Public leaderboard of top referrers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get top referrers (anonymized)
    const { data: topReferrers, error } = await supabase
      .from("waitlist")
      .select("email, referral_count, position, created_at")
      .order("referral_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // Anonymize emails for privacy
    const anonymized = topReferrers?.map((entry, index) => ({
      rank: index + 1,
      email: anonymizeEmail(entry.email),
      referralCount: entry.referral_count,
      position: entry.position,
      joinedDaysAgo: Math.floor(
        (Date.now() - new Date(entry.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    // Get total waitlist stats
    const { count: totalUsers } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    const { data: allReferrals } = await supabase
      .from("waitlist")
      .select("referral_count");

    const totalReferrals = allReferrals?.reduce(
      (sum, e) => sum + (e.referral_count || 0),
      0
    );

    return NextResponse.json({
      leaderboard: anonymized || [],
      stats: {
        totalUsers: totalUsers || 0,
        totalReferrals: totalReferrals || 0,
        avgReferrals:
          totalUsers && totalUsers > 0
            ? ((totalReferrals || 0) / totalUsers).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error in leaderboard GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function anonymizeEmail(email: string): string {
  const [username, domain] = email.split("@");
  if (username.length <= 3) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.substring(0, 3)}***@${domain}`;
}
