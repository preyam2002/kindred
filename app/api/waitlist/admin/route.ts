import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

// GET - Get waitlist statistics and entries
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // In production, check if user is admin
    // For now, just require authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") || "pending";

    const offset = (page - 1) * limit;

    // Get total count
    const { count: totalCount } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    // Get entries
    const { data: entries, error } = await supabase
      .from("waitlist")
      .select("*")
      .eq("status", status)
      .order("position", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching waitlist entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch entries" },
        { status: 500 }
      );
    }

    // Get statistics
    const { count: pendingCount } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: approvedCount } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    const { count: convertedCount } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "converted");

    // Get top referrers
    const { data: topReferrers } = await supabase
      .from("waitlist")
      .select("*")
      .order("referral_count", { ascending: false })
      .limit(10);

    // Calculate average referrals
    const { data: allEntries } = await supabase
      .from("waitlist")
      .select("referral_count");

    const avgReferrals =
      allEntries && allEntries.length > 0
        ? (
            allEntries.reduce((sum, e) => sum + (e.referral_count || 0), 0) /
            allEntries.length
          ).toFixed(2)
        : 0;

    return NextResponse.json({
      entries: entries || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
      },
      stats: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        converted: convertedCount || 0,
        total: (pendingCount || 0) + (approvedCount || 0) + (convertedCount || 0),
        avgReferrals: parseFloat(avgReferrals as string),
      },
      topReferrers: topReferrers || [],
    });
  } catch (error) {
    console.error("Error in waitlist admin GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Approve/invite users from waitlist
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, emails, batchSize } = body;

    if (action === "approve_batch") {
      // Approve top N users
      const size = batchSize || 50;

      const { data: topUsers, error: fetchError } = await supabase
        .from("waitlist")
        .select("email, id")
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(size);

      if (fetchError || !topUsers) {
        return NextResponse.json(
          { error: "Failed to fetch users" },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabase
        .from("waitlist")
        .update({
          status: "approved",
          invited_at: new Date().toISOString(),
        })
        .in(
          "id",
          topUsers.map((u) => u.id)
        );

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to approve users" },
          { status: 500 }
        );
      }

      // Note: Email invitations can be sent here in the future
      // For now, users are approved and can sign up with their email
      // To implement: integrate with email service (e.g., Resend, SendGrid)
      // and send invitation emails to approved users

      return NextResponse.json({
        success: true,
        approved: topUsers.length,
        emails: topUsers.map((u) => u.email),
      });
    } else if (action === "approve_specific" && emails) {
      // Approve specific emails
      const { error: updateError } = await supabase
        .from("waitlist")
        .update({
          status: "approved",
          invited_at: new Date().toISOString(),
        })
        .in("email", emails);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to approve users" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        approved: emails.length,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in waitlist admin POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
