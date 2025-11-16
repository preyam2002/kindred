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
      .eq("user_email", session.user.email)
      .gte("rating", 7); // Only highly rated items

    if (!myLibrary || myLibrary.length < 5) {
      return NextResponse.json({ twins: [] });
    }

    const myMediaIds = new Set(myLibrary.map((item: any) => item.media_id));
    const myRatings = new Map(
      myLibrary.map((item: any) => [item.media_id, item.rating])
    );

    // Get other users' libraries
    const { data: otherUsers } = await supabase
      .from("library")
      .select("user_email, media_id, rating")
      .neq("user_email", session.user.email)
      .gte("rating", 7);

    if (!otherUsers || otherUsers.length === 0) {
      return NextResponse.json({ twins: [] });
    }

    // Group by user
    const userLibraries = new Map<string, Array<{ media_id: string; rating: number }>>();
    otherUsers.forEach((item: any) => {
      if (!userLibraries.has(item.user_email)) {
        userLibraries.set(item.user_email, []);
      }
      userLibraries.get(item.user_email)!.push({
        media_id: item.media_id,
        rating: item.rating,
      });
    });

    // Calculate compatibility
    const twins: any[] = [];

    userLibraries.forEach((theirLibrary, userEmail) => {
      const theirMediaIds = new Set(theirLibrary.map((item) => item.media_id));
      const shared = Array.from(myMediaIds).filter((id) => theirMediaIds.has(id));

      if (shared.length < 3) return; // Need at least 3 shared items

      // Calculate rating similarity for shared items
      let ratingDifference = 0;
      shared.forEach((mediaId) => {
        const myRating = myRatings.get(mediaId) || 0;
        const theirRating = theirLibrary.find((item) => item.media_id === mediaId)?.rating || 0;
        ratingDifference += Math.abs(myRating - theirRating);
      });

      const avgRatingDiff = ratingDifference / shared.length;
      const ratingScore = Math.max(0, 100 - avgRatingDiff * 10);

      // Jaccard similarity for shared items
      const union = new Set([...myMediaIds, ...theirMediaIds]);
      const jaccardScore = (shared.length / union.size) * 100;

      // Final compatibility score
      const compatibilityScore = Math.round(ratingScore * 0.6 + jaccardScore * 0.4);

      if (compatibilityScore >= 90) {
        twins.push({
          user_id: userEmail,
          username: userEmail.split("@")[0],
          compatibility_score: compatibilityScore,
          shared_favorites: shared.length,
          shared_genres: [], // Would need genre analysis
          influence_score: Math.round(compatibilityScore * (shared.length / 10)),
          recommendations_from_them: Math.floor(shared.length * 0.3),
        });
      }
    });

    // Sort by compatibility
    twins.sort((a, b) => b.compatibility_score - a.compatibility_score);

    return NextResponse.json({ twins: twins.slice(0, 10) });
  } catch (error) {
    console.error("Error fetching taste twins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
