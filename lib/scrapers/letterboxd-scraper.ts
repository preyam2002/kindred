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
        displayName = $(".profile-person h1").text().trim() || username;
      }

      // Parse film entries
      const filmItems = $("li.poster-container");

      if (filmItems.length === 0) {
        hasMore = false;
        break;
      }

      filmItems.each((_, element) => {
        const $film = $(element);

        // Get film slug (ID)
        const filmLink = $film.find("div.film-poster").attr("data-film-slug");
        if (!filmLink) return;

        // Get title
        const title = $film.find("img").attr("alt") || "";

        // Get poster URL
        const posterUrl = $film.find("img").attr("src");

        // Get rating (1-5 stars, or half stars)
        const ratingClass = $film.find(".rating").attr("class");
        let rating: number | undefined;
        if (ratingClass) {
          const ratingMatch = ratingClass.match(/rated-(\d+)/);
          if (ratingMatch) {
            // Letterboxd uses 1-10 scale in CSS (2 = 1 star, 10 = 5 stars)
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
          const watchedDate = $row
            .find("td.td-day a time")
            .attr("datetime");

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
