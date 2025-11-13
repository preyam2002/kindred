import { NextRequest, NextResponse } from "next/server";
import { scrapeLetterboxdProfile } from "@/lib/scrapers/letterboxd-scraper";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Scrape Letterboxd profile
    const profile = await scrapeLetterboxdProfile(username);

    // Store movies in database
    const insertedMovies = [];

    for (const film of profile.films) {
      // Check if movie exists
      const { data: existing } = await supabase
        .from("movies")
        .select("id")
        .eq("source", "letterboxd")
        .eq("source_item_id", film.filmId)
        .single();

      if (!existing && film.filmId) {
        // Insert new movie
        const { data: newMovie, error } = await supabase
          .from("movies")
          .insert({
            source: "letterboxd",
            source_item_id: film.filmId,
            title: film.title,
            year: film.year,
            poster_url: film.posterUrl,
          })
          .select()
          .single();

        if (!error && newMovie) {
          insertedMovies.push({
            ...newMovie,
            rating: film.rating,
            watchedDate: film.watchedDate,
          });
        }
      } else if (existing) {
        insertedMovies.push({
          ...existing,
          rating: film.rating,
          watchedDate: film.watchedDate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        totalFilms: profile.totalFilms,
      },
      movies: insertedMovies,
      scrapedCount: profile.films.length,
    });
  } catch (error) {
    console.error("Error in Letterboxd scrape API:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape Letterboxd profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for preview (no storage)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Scrape Letterboxd profile
    const profile = await scrapeLetterboxdProfile(username);

    return NextResponse.json({
      success: true,
      username: profile.username,
      displayName: profile.displayName,
      totalFilms: profile.totalFilms,
      films: profile.films.slice(0, 20), // Return top 20 for preview
    });
  } catch (error) {
    console.error("Error in Letterboxd preview API:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape Letterboxd profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
