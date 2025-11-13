import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

// POST - Join waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, referredBy } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("waitlist")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          existing: true,
          position: existing.position,
          referralCode: existing.referral_code,
          referralCount: existing.referral_count,
        },
        { status: 200 }
      );
    }

    // Validate referral code if provided
    let validReferredBy = null;
    if (referredBy) {
      const { data: referrer } = await supabase
        .from("waitlist")
        .select("referral_code")
        .eq("referral_code", referredBy.toUpperCase())
        .single();

      if (referrer) {
        validReferredBy = referrer.referral_code;
      }
    }

    // Generate unique referral code
    const { data: generatedCode, error: codeError } = await supabase.rpc(
      "generate_waitlist_referral_code",
      { email_param: email.toLowerCase() }
    );

    if (codeError || !generatedCode) {
      console.error("Error generating referral code:", codeError);
      return NextResponse.json(
        { error: "Failed to generate referral code" },
        { status: 500 }
      );
    }

    const referralCode = generatedCode;

    // Calculate initial position
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const position = (count || 0) + 1;

    // Insert into waitlist
    const { data: entry, error: insertError } = await supabase
      .from("waitlist")
      .insert({
        email: email.toLowerCase(),
        name: name || null,
        referral_code: referralCode,
        referred_by: validReferredBy,
        position: position,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting waitlist entry:", insertError);
      return NextResponse.json(
        { error: "Failed to join waitlist" },
        { status: 500 }
      );
    }

    // Recalculate positions to account for referrals
    await supabase.rpc("recalculate_waitlist_positions");

    // Get updated position
    const { data: updated } = await supabase
      .from("waitlist")
      .select("position, referral_count")
      .eq("email", email.toLowerCase())
      .single();

    return NextResponse.json({
      success: true,
      position: updated?.position || position,
      referralCode: referralCode,
      referralCount: updated?.referral_count || 0,
      referredBy: validReferredBy,
    });
  } catch (error) {
    console.error("Error in waitlist POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check waitlist status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const referralCode = searchParams.get("code");

    if (!email && !referralCode) {
      return NextResponse.json(
        { error: "Email or referral code required" },
        { status: 400 }
      );
    }

    let query = supabase.from("waitlist").select("*");

    if (email) {
      query = query.eq("email", email.toLowerCase());
    } else if (referralCode) {
      query = query.eq("referral_code", referralCode.toUpperCase());
    }

    const { data: entry, error } = await query.single();

    if (error || !entry) {
      return NextResponse.json(
        { error: "Not found on waitlist" },
        { status: 404 }
      );
    }

    // Get total waitlist size
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get referrals
    const { data: referrals } = await supabase
      .from("waitlist")
      .select("email, created_at, status")
      .eq("referred_by", entry.referral_code)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      position: entry.position,
      totalWaitlist: count || 0,
      referralCode: entry.referral_code,
      referralCount: entry.referral_count,
      status: entry.status,
      referrals: referrals || [],
      createdAt: entry.created_at,
    });
  } catch (error) {
    console.error("Error in waitlist GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
