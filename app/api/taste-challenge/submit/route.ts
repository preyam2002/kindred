import { NextRequest, NextResponse } from "next/server";

interface Rating {
  itemId: string;
  userRating: number;
  originalRating: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, ratings } = body as {
      challengeId: string;
      ratings: Rating[];
    };

    if (!challengeId || !ratings || ratings.length === 0) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Calculate compatibility score
    let totalDifference = 0;
    let exactMatches = 0;
    let closeMatches = 0;

    ratings.forEach((rating) => {
      const difference = Math.abs(rating.userRating - rating.originalRating);
      totalDifference += difference;

      if (difference === 0) {
        exactMatches++;
      } else if (difference <= 2) {
        closeMatches++;
      }
    });

    // Calculate percentage (0-100)
    // Perfect match = 0 difference, worst match = 7 difference per item
    const maxPossibleDifference = ratings.length * 7; // max difference is 7 (10 - 3)
    const percentage = Math.max(
      0,
      Math.round((1 - totalDifference / maxPossibleDifference) * 100)
    );

    // Calculate score out of 100
    const score = percentage;

    // Generate message based on score
    let message = "";
    let badges: string[] = [];

    if (percentage >= 90) {
      message = "🎯 Perfect Match! You two are taste twins!";
      badges = ["Taste Twins", "Perfect Harmony", "Soulmates"];
    } else if (percentage >= 80) {
      message = "🔥 Incredible Match! Your tastes are extremely similar!";
      badges = ["Kindred Spirits", "Taste Match"];
    } else if (percentage >= 70) {
      message = "✨ Great Match! You have a lot in common!";
      badges = ["Great Chemistry", "Similar Taste"];
    } else if (percentage >= 60) {
      message = "👍 Good Match! You share some common ground.";
      badges = ["Compatible"];
    } else if (percentage >= 50) {
      message = "🤔 Moderate Match. You have different but overlapping tastes.";
      badges = ["Different Perspectives"];
    } else if (percentage >= 40) {
      message = "🎲 Mixed Results. Your tastes diverge quite a bit.";
      badges = ["Opposites"];
    } else {
      message = "🌈 Complete Opposites! You couldn't be more different!";
      badges = ["Polar Opposites", "Unique Taste"];
    }

    // Add special badges
    if (exactMatches >= ratings.length * 0.5) {
      badges.push("Mind Reader");
    }
    if (exactMatches + closeMatches >= ratings.length * 0.8) {
      badges.push("Close Call Expert");
    }

    return NextResponse.json({
      score,
      percentage,
      message,
      breakdown: {
        exact_matches: exactMatches,
        close_matches: closeMatches,
        total_items: ratings.length,
      },
      badges: badges.slice(0, 3), // Max 3 badges
    });
  } catch (error) {
    console.error("Error submitting challenge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
