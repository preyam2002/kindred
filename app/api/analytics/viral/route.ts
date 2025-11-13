import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // For now, allow authenticated users to view analytics
    // In production, restrict to admin users
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d

    let daysAgo = 7;
    if (period === "30d") daysAgo = 30;
    if (period === "90d") daysAgo = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get share stats
    const { data: shares, error: sharesError } = await supabase
      .from("shares")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (sharesError) {
      console.error("Error fetching shares:", sharesError);
    }

    // Get referral stats
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError);
    }

    // Get share clicks
    const { data: clicks, error: clicksError } = await supabase
      .from("share_clicks")
      .select("*")
      .gte("clicked_at", startDate.toISOString());

    if (clicksError) {
      console.error("Error fetching clicks:", clicksError);
    }

    // Calculate metrics
    const totalShares = shares?.length || 0;
    const totalClicks = clicks?.length || 0;
    const totalReferrals = referrals?.length || 0;
    const convertedReferrals =
      referrals?.filter((r: any) => r.referred_user_id !== null).length || 0;

    // Calculate viral coefficient (K-factor)
    // K = (shares per user) × (conversion rate)
    // Simplified: total conversions / total users who shared
    const uniqueSharers = new Set(shares?.map((s: any) => s.user_id) || [])
      .size;
    const kFactor =
      uniqueSharers > 0 ? convertedReferrals / uniqueSharers : 0;

    // Breakdown by platform
    const sharesByPlatform: Record<string, number> = {};
    shares?.forEach((share: any) => {
      sharesByPlatform[share.platform] =
        (sharesByPlatform[share.platform] || 0) + 1;
    });

    // Breakdown by share type
    const sharesByType: Record<string, number> = {};
    shares?.forEach((share: any) => {
      sharesByType[share.share_type] =
        (sharesByType[share.share_type] || 0) + 1;
    });

    // Daily breakdown for charts
    const dailyBreakdown: Record<
      string,
      { shares: number; clicks: number; conversions: number }
    > = {};

    // Initialize all days in range
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyBreakdown[dateStr] = { shares: 0, clicks: 0, conversions: 0 };
    }

    // Fill in actual data
    shares?.forEach((share: any) => {
      const dateStr = new Date(share.created_at).toISOString().split("T")[0];
      if (dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr].shares++;
      }
    });

    clicks?.forEach((click: any) => {
      const dateStr = new Date(click.clicked_at).toISOString().split("T")[0];
      if (dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr].clicks++;
      }
    });

    referrals
      ?.filter((r: any) => r.converted_at)
      .forEach((referral: any) => {
        const dateStr = new Date(referral.converted_at)
          .toISOString()
          .split("T")[0];
        if (dailyBreakdown[dateStr]) {
          dailyBreakdown[dateStr].conversions++;
        }
      });

    // Convert to array sorted by date
    const dailyData = Object.entries(dailyBreakdown)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top sharers
    const sharerCounts: Record<string, number> = {};
    shares?.forEach((share: any) => {
      sharerCounts[share.user_id] = (sharerCounts[share.user_id] || 0) + 1;
    });

    const topSharers = Object.entries(sharerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return NextResponse.json({
      period: `${daysAgo} days`,
      summary: {
        totalShares,
        totalClicks,
        totalReferrals,
        convertedReferrals,
        kFactor: kFactor.toFixed(2),
        conversionRate:
          totalClicks > 0
            ? ((convertedReferrals / totalClicks) * 100).toFixed(2) + "%"
            : "0%",
        uniqueSharers,
      },
      sharesByPlatform,
      sharesByType,
      dailyData,
      topSharers,
    });
  } catch (error) {
    console.error("Error fetching viral analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
