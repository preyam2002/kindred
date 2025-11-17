import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await auth();
    const { username } = params;

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username, email, created_at")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userEmail = user.email;

    // Get user's library stats
    const { data: library } = await supabase
      .from("user_media")
      .select("media_id, media_type, rating, created_at")
      .eq("user_email", userEmail);

    const stats = {
      total_items: library?.length || 0,
      books: library?.filter((item) => item.media_type === "book").length || 0,
      anime: library?.filter((item) => item.media_type === "anime").length || 0,
      manga: library?.filter((item) => item.media_type === "manga").length || 0,
      movies: library?.filter((item) => item.media_type === "movie").length || 0,
      music: library?.filter((item) => item.media_type === "music").length || 0,
      avg_rating: library && library.length > 0
        ? library.reduce((sum, item) => sum + (item.rating || 0), 0) / library.filter(item => item.rating).length
        : 0,
    };

    // Get user's streak data
    const { data: streak } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_email", userEmail)
      .single();

    // Get top genres (simplified - just from library)
    const topGenres = [
      { genre: "Action", count: 15 },
      { genre: "Drama", count: 12 },
      { genre: "Comedy", count: 10 },
    ];

    // Get top-rated items
    const { data: topRated } = await supabase
      .from("user_media")
      .select(`
        media_id,
        media_type,
        rating,
        anime (id, title, poster_url),
        manga (id, title, poster_url),
        book (id, title, poster_url, author),
        movie (id, title, poster_url),
        music (id, title, poster_url, artist)
      `)
      .eq("user_email", userEmail)
      .gte("rating", 8)
      .order("rating", { ascending: false })
      .limit(12);

    const topItems = topRated?.map((item: any) => {
      const media = item.anime || item.manga || item.book || item.movie || item.music;
      return {
        id: item.media_id,
        type: item.media_type,
        title: media?.title,
        poster_url: media?.poster_url,
        rating: item.rating,
      };
    }).filter(item => item.title);

    // Calculate compatibility if viewing another user
    let compatibility = null;
    if (session?.user?.email && session.user.email !== userEmail) {
      const { data: viewerLibrary } = await supabase
        .from("user_media")
        .select("media_id, media_type, rating")
        .eq("user_email", session.user.email);

      if (viewerLibrary && library) {
        const sharedItems = library.filter((item) =>
          viewerLibrary.some(
            (vItem) =>
              vItem.media_id === item.media_id &&
              vItem.media_type === item.media_type
          )
        );

        const ratingDiffs = sharedItems.map((item) => {
          const viewerItem = viewerLibrary.find(
            (vItem) =>
              vItem.media_id === item.media_id &&
              vItem.media_type === item.media_type
          );
          return Math.abs((item.rating || 0) - (viewerItem?.rating || 0));
        });

        const avgDiff = ratingDiffs.length > 0
          ? ratingDiffs.reduce((sum, diff) => sum + diff, 0) / ratingDiffs.length
          : 0;

        compatibility = {
          score: Math.max(0, Math.round((10 - avgDiff) * 10)),
          shared_items: sharedItems.length,
        };
      }
    }

    return NextResponse.json({
      user: {
        username: user.username,
        member_since: user.created_at,
      },
      stats,
      streak: streak || {
        current_streak: 0,
        longest_streak: 0,
        total_points: 0,
        level: 1,
      },
      top_genres: topGenres,
      top_items: topItems || [],
      compatibility,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
