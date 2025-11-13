import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { shareType, platform, metadata } = body;

    if (!shareType || !platform) {
      return NextResponse.json(
        { error: "shareType and platform are required" },
        { status: 400 }
      );
    }

    // Record the share
    const { data: share, error: shareError } = await supabase
      .from("shares")
      .insert({
        user_id: userId,
        share_type: shareType,
        platform: platform,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (shareError) {
      console.error("Error recording share:", shareError);
      return NextResponse.json(
        { error: "Failed to record share" },
        { status: 500 }
      );
    }

    // Generate referral code if this is a challenge/invite share
    let referralCode = null;
    if (shareType === "challenge" || shareType === "profile") {
      // Check if user already has a referral code
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingReferral) {
        referralCode = existingReferral.referral_code;
      } else {
        // Generate new referral code
        const { data: newReferral, error: referralError } = await supabase.rpc(
          "generate_referral_code",
          { user_id_param: userId }
        );

        if (!referralError && newReferral) {
          referralCode = newReferral;

          // Store referral
          await supabase.from("referrals").insert({
            referrer_id: userId,
            referral_code: referralCode,
            metadata: { share_id: share.id },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      shareId: share.id,
      referralCode: referralCode,
    });
  } catch (error) {
    console.error("Error in share API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to track share clicks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");
    const referralCode = searchParams.get("ref");

    if (!shareId && !referralCode) {
      return NextResponse.json(
        { error: "shareId or referral code required" },
        { status: 400 }
      );
    }

    // Get IP and user agent for tracking
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // Record click
    const clickData: any = {
      ip_address: ipAddress,
      user_agent: userAgent,
      clicked_at: new Date().toISOString(),
    };

    if (shareId) {
      clickData.share_id = shareId;
    }

    if (referralCode) {
      clickData.referral_code = referralCode;

      // Update referral clicked_at if not already clicked
      await supabase
        .from("referrals")
        .update({ clicked_at: new Date().toISOString() })
        .eq("referral_code", referralCode)
        .is("clicked_at", null);
    }

    await supabase.from("share_clicks").insert(clickData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking share click:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
