// Letterboxd CSV import utilities
import { supabase } from "@/lib/db/supabase";
import { parseLetterboxdCSV, type ParsedLetterboxdFilm } from "./letterboxd-csv";
import { fetchMoviePoster } from "@/lib/cover-images";
import type { LetterboxdProfile, LetterboxdFilm } from "@/lib/scrapers/letterboxd-scraper";

/**
 * Import Letterboxd CSV data and sync to database
 */
export async function importLetterboxdCSV(
  userId: string,
  csvText: string,
  letterboxdProfileUrl?: string
): Promise<{ imported: number; errors: number }> {
  try {
    // Verify user exists before proceeding
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error(`User not found: ${userId}`, userError);
      throw new Error(`User not found: ${userId}`);
    }

    // Parse CSV
    const films = parseLetterboxdCSV(csvText);

    if (films.length === 0) {
      throw new Error("No films found in CSV file");
    }

    // Get or create source record
    const { data: existingSource } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", userId)
      .eq("source_name", "letterboxd")
      .single();

    if (existingSource) {
      // Update existing source
      await supabase
        .from("sources")
        .update({
          source_user_id: letterboxdProfileUrl || "",
          access_token: letterboxdProfileUrl || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);
    } else {
      // Create new source
      await supabase.from("sources").insert({
        user_id: userId,
        source_name: "letterboxd",
        source_user_id: letterboxdProfileUrl || "",
        access_token: letterboxdProfileUrl || "",
      });
    }

    let imported = 0;
    let errors = 0;

    // Step 1: Create source item IDs for all films
    const filmSourceIds = films.map(film => 
      film.year ? `${film.title} (${film.year})` : film.title
    );

    // Step 2: Batch check which movies already exist
    const { data: existingMovies } = await supabase
      .from("movies")
      .select("id, source_item_id, poster_url")
      .eq("source", "letterboxd")
      .in("source_item_id", filmSourceIds);

    const existingMovieMap = new Map(
      (existingMovies || []).map(item => [item.source_item_id, item])
    );

    // Step 3: Prepare new movies and user_media records
    const newMovies: Array<{
      source: string;
      source_item_id: string;
      title: string;
      year?: number;
      poster_url?: string;
    }> = [];
    
    const movieMap = new Map<string, { id: string; needsCover: boolean }>();
    const filmsNeedingCovers: Array<{ film: ParsedLetterboxdFilm; mediaId: string }> = [];

    for (const film of films) {
      const sourceItemId = film.year ? `${film.title} (${film.year})` : film.title;
      const existing = existingMovieMap.get(sourceItemId);
      
      if (existing) {
        movieMap.set(sourceItemId, { id: existing.id, needsCover: !existing.poster_url });
        if (!existing.poster_url) {
          filmsNeedingCovers.push({ film, mediaId: existing.id });
        }
      } else {
        newMovies.push({
          source: "letterboxd",
          source_item_id: sourceItemId,
          title: film.title,
          year: film.year,
        });
      }
    }

    // Step 4: Fetch posters in parallel for items that need them (limit concurrency)
    const BATCH_SIZE = 10;
    const coverResults = new Map<string, string | undefined>();
    
    for (let i = 0; i < filmsNeedingCovers.length; i += BATCH_SIZE) {
      const batch = filmsNeedingCovers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async ({ film, mediaId }) => {
          try {
            const posterResult = await fetchMoviePoster(film.title, film.year);
            if (posterResult.poster_url) {
              coverResults.set(mediaId, posterResult.poster_url);
            }
          } catch (error) {
            // Continue without poster if fetch fails
          }
        })
      );
    }

    // Step 5: Fetch posters for new items (parallel)
    const newCovers = new Map<string, string | undefined>();
    for (let i = 0; i < newMovies.length; i += BATCH_SIZE) {
      const batch = newMovies.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          const film = films.find(f => {
            const sourceId = f.year ? `${f.title} (${f.year})` : f.title;
            return sourceId === item.source_item_id;
          });
          if (film) {
            try {
              const posterResult = await fetchMoviePoster(film.title, film.year);
              if (posterResult.poster_url) {
                newCovers.set(item.source_item_id, posterResult.poster_url);
              }
            } catch (error) {
              // Continue without poster
            }
          }
        })
      );
    }

    // Add posters to new movies
    newMovies.forEach(item => {
      const coverUrl = newCovers.get(item.source_item_id);
      if (coverUrl) {
        item.poster_url = coverUrl;
      }
    });

    // Step 6: Batch insert new movies
    if (newMovies.length > 0) {
      const { data: insertedMovies, error: insertError } = await supabase
        .from("movies")
        .insert(newMovies)
        .select("id, source_item_id");

      if (insertError) {
        console.error("Error batch inserting movies:", insertError);
        errors += newMovies.length;
      } else {
        // Add new items to map
        insertedMovies?.forEach(item => {
          movieMap.set(item.source_item_id, { id: item.id, needsCover: false });
        });
      }
    }

    // Step 7: Batch update posters for existing items
    if (coverResults.size > 0) {
      const coverUpdates = Array.from(coverResults.entries()).map(([mediaId, posterUrl]) => ({
        id: mediaId,
        poster_url: posterUrl,
      }));

      // Update in batches
      for (let i = 0; i < coverUpdates.length; i += 100) {
        const batch = coverUpdates.slice(i, i + 100);
        await Promise.all(
          batch.map(update =>
            supabase
              .from("movies")
              .update({ poster_url: update.poster_url })
              .eq("id", update.id)
          )
        );
      }
    }

    // Step 8: Prepare user_media records
    const userMediaRecords: Array<{
      user_id: string;
      media_type: string;
      media_id: string;
      rating?: number;
      timestamp: Date;
      tags?: string[];
    }> = [];

    for (const film of films) {
      const sourceItemId = film.year ? `${film.title} (${film.year})` : film.title;
      const movieItem = movieMap.get(sourceItemId);
      if (!movieItem) {
        errors++;
        continue;
      }

      // Ensure timestamp is always a valid Date
      let timestamp = new Date();
      if (film.watchedDate) {
        const date = new Date(film.watchedDate);
        if (!isNaN(date.getTime())) {
          timestamp = date;
        }
      } else if (film.diaryDate) {
        const date = new Date(film.diaryDate);
        if (!isNaN(date.getTime())) {
          timestamp = date;
        }
      }
      const rating = film.rating ? Math.round(film.rating * 2) : undefined;

      userMediaRecords.push({
        user_id: userId,
        media_type: "movie",
        media_id: movieItem.id,
        rating,
        timestamp,
        tags: film.tags || undefined,
      });
    }

    // Step 9: Batch upsert user_media records
    if (userMediaRecords.length > 0) {
      // Upsert in batches of 500 (Supabase limit)
      const BATCH_SIZE = 500;
      for (let i = 0; i < userMediaRecords.length; i += BATCH_SIZE) {
        const batch = userMediaRecords.slice(i, i + BATCH_SIZE);
        const { error: userMediaError } = await supabase
          .from("user_media")
          .upsert(batch, {
            onConflict: "user_id,media_type,media_id",
          });

        if (userMediaError) {
          console.error(`Error batch upserting user_media (batch ${i / BATCH_SIZE + 1}):`, userMediaError);
          errors += batch.length;
        } else {
          imported += batch.length;
        }
      }
    }

    return { imported, errors };
  } catch (error) {
    console.error("Error importing Letterboxd CSV:", error);
    throw error;
  }
}

/**
 * Import Letterboxd scraped data and sync to database
 */
export async function importLetterboxdScraped(
  userId: string,
  profile: LetterboxdProfile,
  letterboxdProfileUrl?: string
): Promise<{ imported: number; errors: number }> {
  try {
    // Verify user exists before proceeding
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error(`User not found: ${userId}`, userError);
      throw new Error(`User not found: ${userId}`);
    }

    if (profile.films.length === 0) {
      throw new Error("No films found in scraped profile");
    }

    // Get or create source record
    const profileUrl = letterboxdProfileUrl || `https://letterboxd.com/${profile.username}/`;
    const { data: existingSource } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", userId)
      .eq("source_name", "letterboxd")
      .single();

    if (existingSource) {
      // Update existing source
      await supabase
        .from("sources")
        .update({
          source_user_id: profileUrl,
          access_token: profileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);
    } else {
      // Create new source
      await supabase.from("sources").insert({
        user_id: userId,
        source_name: "letterboxd",
        source_user_id: profileUrl,
        access_token: profileUrl,
      });
    }

    let imported = 0;
    let errors = 0;

    // Step 1: Create source item IDs for all films
    const filmSourceIds = profile.films.map(film => 
      film.year ? `${film.title} (${film.year})` : film.title
    );

    // Step 2: Batch check which movies already exist
    const { data: existingMovies } = await supabase
      .from("movies")
      .select("id, source_item_id, poster_url")
      .eq("source", "letterboxd")
      .in("source_item_id", filmSourceIds);

    const existingMovieMap = new Map(
      (existingMovies || []).map(item => [item.source_item_id, item])
    );

    // Step 3: Prepare new movies and user_media records
    const newMovies: Array<{
      source: string;
      source_item_id: string;
      title: string;
      year?: number;
      poster_url?: string;
    }> = [];
    
    const movieMap = new Map<string, { id: string; needsCover: boolean }>();
    const filmsNeedingCovers: Array<{ film: LetterboxdFilm; mediaId: string }> = [];

    for (const film of profile.films) {
      const sourceItemId = film.year ? `${film.title} (${film.year})` : film.title;
      const existing = existingMovieMap.get(sourceItemId);
      
      if (existing) {
        movieMap.set(sourceItemId, { id: existing.id, needsCover: !existing.poster_url });
        if (!existing.poster_url && !film.posterUrl) {
          filmsNeedingCovers.push({ film, mediaId: existing.id });
        }
      } else {
        newMovies.push({
          source: "letterboxd",
          source_item_id: sourceItemId,
          title: film.title,
          year: film.year,
          poster_url: film.posterUrl,
        });
      }
    }

    // Step 4: Fetch posters in parallel for items that need them (limit concurrency)
    const BATCH_SIZE = 10;
    const coverResults = new Map<string, string | undefined>();
    
    for (let i = 0; i < filmsNeedingCovers.length; i += BATCH_SIZE) {
      const batch = filmsNeedingCovers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async ({ film, mediaId }) => {
          try {
            const posterResult = await fetchMoviePoster(film.title, film.year);
            if (posterResult.poster_url) {
              coverResults.set(mediaId, posterResult.poster_url);
            }
          } catch (error) {
            // Continue without poster if fetch fails
          }
        })
      );
    }

    // Step 5: Fetch posters for new items (parallel)
    const newCovers = new Map<string, string | undefined>();
    for (let i = 0; i < newMovies.length; i += BATCH_SIZE) {
      const batch = newMovies.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          const film = profile.films.find(f => {
            const sourceId = f.year ? `${f.title} (${f.year})` : f.title;
            return sourceId === item.source_item_id;
          });
          if (film && !item.poster_url) {
            try {
              const posterResult = await fetchMoviePoster(film.title, film.year);
              if (posterResult.poster_url) {
                newCovers.set(item.source_item_id, posterResult.poster_url);
              }
            } catch (error) {
              // Continue without poster
            }
          }
        })
      );
    }

    // Add posters to new movies
    newMovies.forEach(item => {
      const coverUrl = newCovers.get(item.source_item_id);
      if (coverUrl) {
        item.poster_url = coverUrl;
      }
    });

    // Step 6: Batch insert new movies
    if (newMovies.length > 0) {
      const { data: insertedMovies, error: insertError } = await supabase
        .from("movies")
        .insert(newMovies)
        .select("id, source_item_id");

      if (insertError) {
        console.error("Error batch inserting movies:", insertError);
        errors += newMovies.length;
      } else {
        // Add new items to map
        insertedMovies?.forEach(item => {
          movieMap.set(item.source_item_id, { id: item.id, needsCover: false });
        });
      }
    }

    // Step 7: Batch update posters for existing items
    if (coverResults.size > 0) {
      const coverUpdates = Array.from(coverResults.entries()).map(([mediaId, posterUrl]) => ({
        id: mediaId,
        poster_url: posterUrl,
      }));

      // Update in batches
      for (let i = 0; i < coverUpdates.length; i += 100) {
        const batch = coverUpdates.slice(i, i + 100);
        await Promise.all(
          batch.map(update =>
            supabase
              .from("movies")
              .update({ poster_url: update.poster_url })
              .eq("id", update.id)
          )
        );
      }
    }

    // Step 8: Prepare user_media records
    const userMediaRecords: Array<{
      user_id: string;
      media_type: string;
      media_id: string;
      rating?: number;
      timestamp: Date;
    }> = [];

    for (const film of profile.films) {
      const sourceItemId = film.year ? `${film.title} (${film.year})` : film.title;
      const movieItem = movieMap.get(sourceItemId);
      if (!movieItem) {
        errors++;
        continue;
      }

      // Ensure timestamp is always a valid Date
      let timestamp = new Date();
      if (film.watchedDate) {
        const date = new Date(film.watchedDate);
        if (!isNaN(date.getTime())) {
          timestamp = date;
        }
      }
      const rating = film.rating ? Math.round(film.rating * 2) : undefined;

      userMediaRecords.push({
        user_id: userId,
        media_type: "movie",
        media_id: movieItem.id,
        rating,
        timestamp,
      });
    }

    // Step 9: Batch upsert user_media records
    if (userMediaRecords.length > 0) {
      // Upsert in batches of 500 (Supabase limit)
      const BATCH_SIZE = 500;
      for (let i = 0; i < userMediaRecords.length; i += BATCH_SIZE) {
        const batch = userMediaRecords.slice(i, i + BATCH_SIZE);
        const { error: userMediaError } = await supabase
          .from("user_media")
          .upsert(batch, {
            onConflict: "user_id,media_type,media_id",
          });

        if (userMediaError) {
          console.error(`Error batch upserting user_media (batch ${i / BATCH_SIZE + 1}):`, userMediaError);
          errors += batch.length;
        } else {
          imported += batch.length;
        }
      }
    }

    return { imported, errors };
  } catch (error) {
    console.error("Error importing Letterboxd scraped data:", error);
    throw error;
  }
}

