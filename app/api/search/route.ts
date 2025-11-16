import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, users, media

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any = {
      users: [],
      media: [],
    };

    // Search users by username
    if (type === "all" || type === "users") {
      const { data: users } = await supabase
        .from("users")
        .select("id, username, email, created_at")
        .ilike("username", `%${query}%`)
        .limit(10);

      if (users) {
        results.users = users.map((user) => ({
          type: "user",
          id: user.id,
          title: user.username,
          subtitle: `@${user.username}`,
          url: `/u/${user.username}`,
        }));
      }
    }

    // Search media items
    if (type === "all" || type === "media") {
      const mediaResults = [];

      // Search anime
      const { data: anime } = await supabase
        .from("anime")
        .select("id, title, poster_url, type")
        .ilike("title", `%${query}%`)
        .limit(5);

      if (anime) {
        mediaResults.push(
          ...anime.map((item) => ({
            type: "media",
            media_type: "anime",
            id: item.id,
            title: item.title,
            subtitle: "Anime",
            poster_url: item.poster_url,
            url: `/media/anime/${item.id}`,
          }))
        );
      }

      // Search manga
      const { data: manga } = await supabase
        .from("manga")
        .select("id, title, poster_url, type")
        .ilike("title", `%${query}%`)
        .limit(5);

      if (manga) {
        mediaResults.push(
          ...manga.map((item) => ({
            type: "media",
            media_type: "manga",
            id: item.id,
            title: item.title,
            subtitle: "Manga",
            poster_url: item.poster_url,
            url: `/media/manga/${item.id}`,
          }))
        );
      }

      // Search books
      const { data: books } = await supabase
        .from("book")
        .select("id, title, poster_url, author, type")
        .ilike("title", `%${query}%`)
        .limit(5);

      if (books) {
        mediaResults.push(
          ...books.map((item) => ({
            type: "media",
            media_type: "book",
            id: item.id,
            title: item.title,
            subtitle: `Book${item.author ? ` by ${item.author}` : ""}`,
            poster_url: item.poster_url,
            url: `/media/book/${item.id}`,
          }))
        );
      }

      // Search movies
      const { data: movies } = await supabase
        .from("movie")
        .select("id, title, poster_url, type")
        .ilike("title", `%${query}%`)
        .limit(5);

      if (movies) {
        mediaResults.push(
          ...movies.map((item) => ({
            type: "media",
            media_type: "movie",
            id: item.id,
            title: item.title,
            subtitle: "Movie",
            poster_url: item.poster_url,
            url: `/media/movie/${item.id}`,
          }))
        );
      }

      results.media = mediaResults;
    }

    return NextResponse.json({
      query,
      results: {
        users: results.users,
        media: results.media,
        total: results.users.length + results.media.length,
      },
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
