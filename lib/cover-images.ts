// Cover image fetching utilities for books and movies
import { supabase } from "./db/supabase";

interface CoverImageResult {
  poster_url?: string;
  error?: string;
}

/**
 * Fetch book cover image from Open Library API
 */
export async function fetchBookCover(
  title: string,
  author?: string,
  isbn?: string
): Promise<CoverImageResult> {
  try {
    // Try ISBN first (most reliable)
    if (isbn) {
      const isbnClean = isbn.replace(/[-\s]/g, "");
      const url = `https://covers.openlibrary.org/b/isbn/${isbnClean}-L.jpg`;
      
      // Check if image exists
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok && response.headers.get("content-type")?.startsWith("image")) {
        return { poster_url: url };
      }
    }

    // Fallback: Search by title and author
    if (title && author) {
      const searchQuery = encodeURIComponent(`${title} ${author}`);
      const searchUrl = `https://openlibrary.org/search.json?q=${searchQuery}&limit=1`;

      const searchResponse = await fetch(searchUrl);
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        const book = data.docs?.[0];

        if (book?.isbn?.[0]) {
          const isbn = book.isbn[0].replace(/[-\s]/g, "");
          const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
          
          const coverResponse = await fetch(coverUrl, { method: "HEAD" });
          if (coverResponse.ok && coverResponse.headers.get("content-type")?.startsWith("image")) {
            return { poster_url: coverUrl };
          }
        }

        // Try cover ID if available
        if (book?.cover_i) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
          return { poster_url: coverUrl };
        }
      }
    }

    return { poster_url: undefined };
  } catch (error) {
    console.error("Error fetching book cover:", error);
    return { poster_url: undefined, error: "Failed to fetch cover" };
  }
}

/**
 * Fetch movie poster from TMDB API
 * Note: Requires TMDB API key in environment variable TMDB_API_KEY
 */
export async function fetchMoviePoster(
  title: string,
  year?: number
): Promise<CoverImageResult> {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.warn("TMDB_API_KEY not set, skipping movie poster fetch");
      return { poster_url: undefined };
    }

    // Search for movie
    const searchQuery = encodeURIComponent(title);
    const yearParam = year ? `&year=${year}` : "";
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchQuery}${yearParam}&limit=1`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      return { poster_url: undefined, error: "TMDB API error" };
    }

    const data = await searchResponse.json();
    const movie = data.results?.[0];

    if (movie?.poster_path) {
      const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
      return { poster_url: posterUrl };
    }

    return { poster_url: undefined };
  } catch (error) {
    console.error("Error fetching movie poster:", error);
    return { poster_url: undefined, error: "Failed to fetch poster" };
  }
}

/**
 * Batch update cover images for media items missing posters
 */
export async function updateMissingCovers(
  mediaItems: Array<{ id: string; title: string; type: string; source_item_id?: string }>
): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  for (const item of mediaItems) {
    try {
      let coverResult: CoverImageResult;

      if (item.type === "book") {
        // Try to extract author from title if it contains " by " or similar
        const titleParts = item.title.split(" by ");
        const titleOnly = titleParts[0] || item.title;
        const possibleAuthor = titleParts[1];
        
        coverResult = await fetchBookCover(titleOnly, possibleAuthor, undefined);
      } else if (item.type === "movie") {
        // Extract year from title if available (e.g., "Title (2023)" or "Title 2023")
        const yearMatch = item.title.match(/\((\d{4})\)|(\d{4})$/);
        const year = yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : undefined;
        // Remove year from title for better search
        const titleWithoutYear = item.title.replace(/\s*\(?\d{4}\)?\s*$/, "").trim();
        coverResult = await fetchMoviePoster(titleWithoutYear, year);
      } else {
        continue; // Skip non-book/movie items
      }

      if (coverResult.poster_url) {
        // Update media item with cover URL
        const { error } = await supabase
          .from("media_items")
          .update({ poster_url: coverResult.poster_url })
          .eq("id", item.id);

        if (error) {
          errors++;
        } else {
          updated++;
        }
      }
    } catch (error) {
      console.error(`Error updating cover for ${item.title}:`, error);
      errors++;
    }
  }

  return { updated, errors };
}

