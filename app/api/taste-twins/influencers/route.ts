import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's library
    const { data: myLibrary } = await supabase
      .from("library")
      .select("media_id, rating")
      .eq("user_email", session.user.email);

    if (!myLibrary || myLibrary.length < 5) {
      return NextResponse.json({ influencers: [] });
    }

    const myMediaIds = new Set(myLibrary.map((item: any) => item.media_id));
    const myRatings = new Map(
      myLibrary.map((item: any) => [item.media_id, item.rating || 0])
    );

    // Get other users' libraries
    const { data: otherUsers } = await supabase
      .from("library")
      .select("user_email, media_id, rating")
      .neq("user_email", session.user.email);

    if (!otherUsers || otherUsers.length === 0) {
      return NextResponse.json({ influencers: [] });
    }

    // Group by user
    const userLibraries = new Map<string, Array<{ media_id: string; rating: number }>>();
    otherUsers.forEach((item: any) => {
      if (!userLibraries.has(item.user_email)) {
        userLibraries.set(item.user_email, []);
      }
      userLibraries.get(item.user_email)!.push({
        media_id: item.media_id,
        rating: item.rating || 0,
      });
    });

    // Calculate influence scores
    const influencers: any[] = [];

    userLibraries.forEach((theirLibrary, userEmail) => {
      const theirMediaIds = new Set(theirLibrary.map((item) => item.media_id));
      const shared = Array.from(myMediaIds).filter((id) => theirMediaIds.has(id));

      if (shared.length < 2) return;

      // Calculate rating correlation
      let ratingDifference = 0;
      shared.forEach((mediaId) => {
        const myRating = myRatings.get(mediaId) || 0;
        const theirRating = theirLibrary.find((item) => item.media_id === mediaId)?.rating || 0;
        ratingDifference += Math.abs(myRating - theirRating);
      });

      const avgRatingDiff = ratingDifference / shared.length;
      const compatibility = Math.max(0, Math.round(100 - avgRatingDiff * 10));

      // Influence score based on shared items and compatibility
      const influenceScore = (shared.length / myLibrary.length) * compatibility;

      if (compatibility >= 60) {
        influencers.push({
          user_id: userEmail,
          username: userEmail.split("@")[0],
          influence_percentage: Math.min(100, Math.round(influenceScore)),
          shared_items: shared.length,
          compatibility,
        });
      }
    });

    // Sort by influence
    influencers.sort((a, b) => b.influence_percentage - a.influence_percentage);

    // Normalize percentages to sum to 100 for top 5
    const topInfluencers = influencers.slice(0, 5);
    const totalInfluence = topInfluencers.reduce(
      (sum, inf) => sum + inf.influence_percentage,
      0
    );

    if (totalInfluence > 0) {
      topInfluencers.forEach((inf) => {
        inf.influence_percentage = Math.round(
          (inf.influence_percentage / totalInfluence) * 100
        );
      });
    }

    return NextResponse.json({ influencers: topInfluencers });
  } catch (error) {
    console.error("Error fetching influencers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
