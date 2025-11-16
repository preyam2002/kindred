import * as cheerio from "cheerio";

export interface LetterboxdFilm {
  title: string;
  year?: number;
  rating?: number; // 0.5 to 5 in 0.5 increments
  filmId: string; // slug
  posterUrl?: string;
  watchedDate?: string;
}

export interface LetterboxdProfile {
  username: string;
  displayName?: string;
  films: LetterboxdFilm[];
  totalFilms: number;
}

/**
 * Scrape public Letterboxd profile
 * Works without authentication by parsing public HTML
 */
export async function scrapeLetterboxdProfile(
  username: string
): Promise<LetterboxdProfile> {
  try {
    const films: LetterboxdFilm[] = [];
    let page = 1;
    let hasMore = true;
    let displayName: string | undefined;

    // Letterboxd paginates, fetch first few pages
    while (hasMore && page <= 5) {
      // Limit to 5 pages (~140 films)
      const url = `https://letterboxd.com/${username}/films/page/${page}/`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        if (page === 1) {
          throw new Error(`Failed to fetch Letterboxd profile: ${username}`);
        }
        break;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract display name from first page
      if (page === 1) {
        // Try multiple selectors for display name
        displayName =
          $(".profile-person h1").text().trim() ||
          $("h1.section-heading").text().trim() ||
          username;
      }

      // Parse film entries - Letterboxd now uses div.react-component with data attributes
      const filmItems = $(
        "div.react-component[data-component-class='LazyPoster']"
      );

      if (filmItems.length === 0) {
        // Fallback to old structure if new one doesn't work
        const oldFilmItems = $("li.poster-container");
        if (oldFilmItems.length === 0) {
          hasMore = false;
          break;
        }

        // Use old parsing logic as fallback
        oldFilmItems.each((_, element) => {
          const $film = $(element);
          const filmLink = $film.find("div.film-poster").attr("data-film-slug");
          if (!filmLink) return;
          const title = $film.find("img").attr("alt") || "";
          const posterUrl = $film.find("img").attr("src");
          const ratingClass = $film.find(".rating").attr("class");
          let rating: number | undefined;
          if (ratingClass) {
            const ratingMatch = ratingClass.match(/rated-(\d+)/);
            if (ratingMatch) {
              rating = parseInt(ratingMatch[1]) / 2;
            }
          }
          if (title) {
            films.push({
              title,
              filmId: filmLink,
              rating,
              posterUrl,
            });
          }
        });
      } else {
        // New structure parsing
        // Films are in list items, with react-component and poster-viewingdata as siblings
        filmItems.each((_, element) => {
          const $film = $(element);

          // Get film slug (ID) from data attribute
          const filmSlug = $film.attr("data-item-slug");
          if (!filmSlug) return;

          // Get title from data attribute (includes year if available)
          const fullTitle = $film.attr("data-item-name") || "";

          // Extract year from title if present (e.g., "Film Name (2024)")
          let title = fullTitle;
          let year: number | undefined;
          const yearMatch = fullTitle.match(/\((\d{4})\)$/);
          if (yearMatch) {
            year = parseInt(yearMatch[1]);
            title = fullTitle.replace(/\s*\(\d{4}\)$/, "").trim();
          }

          // Get poster URL from img tag
          const posterUrl =
            $film.find("img.image").attr("src") ||
            $film.find("img").attr("src");

          // Get rating from sibling poster-viewingdata element
          // The rating is in a <p class="poster-viewingdata"> that follows the react-component
          // They're both children of the same parent (usually an li.griditem)
          let rating: number | undefined;
          // Try next sibling first (most common case)
          let $viewingData = $film.next("p.poster-viewingdata");
          // If not found, look in parent (they're siblings in the same parent)
          if ($viewingData.length === 0) {
            $viewingData = $film.parent().find("p.poster-viewingdata").first();
          }

          if ($viewingData.length > 0) {
            const ratingClass = $viewingData.find(".rating").attr("class");
            if (ratingClass) {
              const ratingMatch = ratingClass.match(/rated-(\d+)/);
              if (ratingMatch) {
                // Letterboxd uses 1-10 scale in CSS (2 = 1 star, 10 = 5 stars)
                rating = parseInt(ratingMatch[1]) / 2;
              }
            }
          }

          if (title) {
            films.push({
              title,
              year,
              filmId: filmSlug,
              rating,
              posterUrl,
            });
          }
        });
      }

      page++;
    }

    // Get additional details from diary if available
    const diaryUrl = `https://letterboxd.com/${username}/films/diary/`;
    try {
      const diaryResponse = await fetch(diaryUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (diaryResponse.ok) {
        const diaryHtml = await diaryResponse.text();
        const $diary = cheerio.load(diaryHtml);

        $diary("tr.diary-entry-row").each((_, row) => {
          const $row = $diary(row);
          const filmSlug = $row
            .find("td.td-film-details a")
            .attr("href")
            ?.replace("/film/", "")
            ?.replace("/", "");
          const watchedDate = $row.find("td.td-day a time").attr("datetime");

          if (filmSlug && watchedDate) {
            const film = films.find((f) => f.filmId === filmSlug);
            if (film) {
              film.watchedDate = watchedDate;
            }
          }
        });
      }
    } catch (error) {
      // Diary parsing is optional, continue without it
      console.log("Could not parse diary, continuing...");
    }

    // Extract year from film pages if needed (optional, slower)
    // For now, we'll skip this to keep it fast

    return {
      username,
      displayName: displayName || username,
      films,
      totalFilms: films.length,
    };
  } catch (error) {
    console.error("Error scraping Letterboxd profile:", error);
    throw new Error(
      `Failed to scrape Letterboxd profile for ${username}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get details for a specific film
 */
export async function scrapeLetterboxdFilm(filmSlug: string): Promise<{
  title: string;
  year?: number;
  director?: string;
  posterUrl?: string;
  synopsis?: string;
}> {
  try {
    const url = `https://letterboxd.com/film/${filmSlug}/`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch film: ${filmSlug}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("h1.headline-1").text().trim();
    const yearText = $("h1.headline-1 small a").text().trim();
    const year = yearText ? parseInt(yearText) : undefined;
    const director = $("a.text-slug.text-person").first().text().trim();
    const posterUrl = $("img.image").attr("src");
    const synopsis = $("div.truncate p").text().trim();

    return {
      title,
      year,
      director,
      posterUrl,
      synopsis,
    };
  } catch (error) {
    console.error("Error scraping Letterboxd film:", error);
    throw error;
  }
}
