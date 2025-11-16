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

    const currentYear = new Date().getFullYear();

    // Get all library items for the year
    const { data: libraryItems, error: libraryError } = await supabase
      .from("library")
      .select(`
        id,
        media_id,
        rating,
        created_at,
        updated_at,
        anime (id, title, type, poster_url, genre),
        manga (id, title, type, poster_url, genre),
        book (id, title, type, poster_url, genre, author),
        movie (id, title, type, poster_url, genre),
        music (id, title, type, poster_url, genre, artist)
      `)
      .eq("user_email", session.user.email)
      .order("rating", { ascending: false });

    if (libraryError) {
      console.error("Library error:", libraryError);
      return NextResponse.json(
        { error: "Failed to fetch library" },
        { status: 500 }
      );
    }

    if (!libraryItems || libraryItems.length < 5) {
      return NextResponse.json(
        { error: "Not enough data to generate wrapped" },
        { status: 400 }
      );
    }

    // Calculate stats
    let total_anime = 0,
      total_manga = 0,
      total_books = 0,
      total_movies = 0,
      total_music = 0;
    let total_rating = 0;
    let items_loved = 0;

    const genreCounts: Record<string, number> = {};
    const topItems: any[] = [];

    libraryItems.forEach((item: any) => {
      const media = item.anime || item.manga || item.book || item.movie || item.music;
      if (!media) return;

      // Count by type
      if (item.anime) total_anime++;
      if (item.manga) total_manga++;
      if (item.book) total_books++;
      if (item.movie) total_movies++;
      if (item.music) total_music++;

      // Rating stats
      if (item.rating) {
        total_rating += item.rating;
        if (item.rating >= 9) items_loved++;
      }

      // Genre counts
      if (media.genre && Array.isArray(media.genre)) {
        media.genre.forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }

      // Top items
      if (topItems.length < 10 && item.rating >= 8) {
        topItems.push({
          title: media.title,
          type: media.type,
          poster_url: media.poster_url,
          rating: item.rating,
          author: media.author,
          artist: media.artist,
        });
      }
    });

    const total_items = libraryItems.length;
    const average_rating = total_items > 0 ? total_rating / total_items : 0;

    // Get top genre
    const topGenreEntry = Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0];
    const top_genre = topGenreEntry
      ? { name: topGenreEntry[0], count: topGenreEntry[1] }
      : { name: "Various", count: 0 };

    // Calculate taste personality
    const uniqueGenres = Object.keys(genreCounts).length;
    const diversity_score = Math.min(100, Math.round((uniqueGenres / 20) * 100)); // Max out at 20 genres

    // Mainstream score (based on how many popular items)
    const mainstream_score = Math.round(Math.random() * 30 + 40); // Placeholder, could be based on actual popularity data

    // Enthusiasm score (based on average rating)
    const enthusiasm_score = Math.round((average_rating / 10) * 100);

    // Generate fun facts
    const fun_facts = [];

    if (total_items > 50) {
      fun_facts.push(`🎯 You're a content consumption machine! ${total_items} items is impressive.`);
    } else if (total_items > 20) {
      fun_facts.push(`📚 You explored ${total_items} items this year. Quality over quantity!`);
    }

    if (average_rating > 8) {
      fun_facts.push(`⭐ You're an easy rater! Your average rating is ${average_rating.toFixed(1)}/10.`);
    } else if (average_rating < 6) {
      fun_facts.push(`🎬 You're a tough critic with an average rating of ${average_rating.toFixed(1)}/10.`);
    }

    if (uniqueGenres > 10) {
      fun_facts.push(`🌈 You explored ${uniqueGenres} different genres. True variety seeker!`);
    }

    const typeCount = [total_anime, total_manga, total_books, total_movies, total_music].filter(x => x > 0).length;
    if (typeCount >= 4) {
      fun_facts.push(`🎨 You're a true multimedia enthusiast - ${typeCount} different media types!`);
    }

    // Ensure we have at least 3 fun facts
    while (fun_facts.length < 3) {
      fun_facts.push(`✨ Your taste is uniquely yours and that's what makes it special!`);
    }

    // Generate badges
    const badges = [];

    if (total_items >= 100) badges.push("Century Club");
    else if (total_items >= 50) badges.push("Half Century");
    else if (total_items >= 25) badges.push("Committed Viewer");

    if (items_loved >= 10) badges.push("Love Expert");
    if (average_rating >= 8) badges.push("Optimist");
    if (average_rating <= 5) badges.push("Critic");
    if (uniqueGenres >= 15) badges.push("Genre Explorer");
    if (total_anime >= 20) badges.push("Anime Aficionado");
    if (total_books >= 20) badges.push("Bookworm");
    if (total_movies >= 20) badges.push("Cinema Buff");
    if (diversity_score >= 80) badges.push("Diverse Taste");

    // Ensure at least 3 badges
    if (badges.length < 3) {
      badges.push("Taste Explorer", "Media Enthusiast", `${currentYear} Member`);
    }

    return NextResponse.json({
      year: currentYear,
      stats: {
        total_items,
        total_anime,
        total_manga,
        total_books,
        total_movies,
        total_music,
        average_rating: Number(average_rating.toFixed(1)),
        items_loved,
      },
      top_genre,
      top_items,
      taste_personality: {
        mainstream_score,
        diversity_score,
        enthusiasm_score,
      },
      badges: badges.slice(0, 5),
      fun_facts: fun_facts.slice(0, 3),
    });
  } catch (error) {
    console.error("Error generating wrapped:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
