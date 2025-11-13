import * as cheerio from "cheerio";

export interface GoodreadsBook {
  title: string;
  author: string;
  rating?: number;
  bookId: string;
  coverUrl?: string;
  dateRead?: string;
}

export interface GoodreadsProfile {
  username: string;
  userId: string;
  books: GoodreadsBook[];
  totalBooks: number;
}

/**
 * Scrape public Goodreads profile
 * Works without authentication by parsing public HTML
 */
export async function scrapeGoodreadsProfile(
  username: string
): Promise<GoodreadsProfile> {
  try {
    // First, get user ID from username
    const searchUrl = `https://www.goodreads.com/user/show/${username}`;
    const profileResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch Goodreads profile: ${username}`);
    }

    const profileHtml = await profileResponse.text();
    const $profile = cheerio.load(profileHtml);

    // Extract user ID from the page
    const userIdMatch = profileHtml.match(/\/user\/show\/(\d+)/);
    const userId = userIdMatch ? userIdMatch[1] : username;

    // Get the read books shelf
    const shelfUrl = `https://www.goodreads.com/review/list/${userId}?shelf=read&per_page=100`;
    const shelfResponse = await fetch(shelfUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!shelfResponse.ok) {
      throw new Error("Failed to fetch Goodreads shelf");
    }

    const shelfHtml = await shelfResponse.text();
    const $ = cheerio.load(shelfHtml);

    const books: GoodreadsBook[] = [];

    // Parse book entries from the shelf
    $("#booksBody tr").each((_, element) => {
      const $row = $(element);

      const title =
        $row.find(".title a").text().trim() ||
        $row.find(".field.title").text().trim();
      const author =
        $row.find(".author a").text().trim() ||
        $row.find(".field.author").text().trim();
      const bookId =
        $row.find(".title a").attr("href")?.match(/\/book\/show\/(\d+)/)?.[1] ||
        "";
      const coverUrl = $row.find("img.bookCover").attr("src");

      // Extract rating
      const ratingText = $row.find(".rating .value").text().trim();
      const rating = ratingText ? parseInt(ratingText) : undefined;

      // Extract date read
      const dateRead = $row.find(".date_read .value").text().trim();

      if (title && author) {
        books.push({
          title,
          author,
          rating,
          bookId,
          coverUrl,
          dateRead,
        });
      }
    });

    // Try alternative parsing if first method didn't work
    if (books.length === 0) {
      $(".bookalike").each((_, element) => {
        const $book = $(element);
        const title = $book.find(".bookTitle").text().trim();
        const author = $book.find(".authorName").text().trim();
        const bookId =
          $book.find(".bookTitle").attr("href")?.match(/\/book\/show\/(\d+)/)?.[1] ||
          "";
        const coverUrl = $book.find("img").attr("src");

        if (title && author) {
          books.push({
            title,
            author,
            bookId,
            coverUrl,
          });
        }
      });
    }

    return {
      username,
      userId,
      books,
      totalBooks: books.length,
    };
  } catch (error) {
    console.error("Error scraping Goodreads profile:", error);
    throw new Error(
      `Failed to scrape Goodreads profile for ${username}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Search for Goodreads user by username
 */
export async function searchGoodreadsUser(
  query: string
): Promise<{ userId: string; username: string } | null> {
  try {
    const searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(
      query
    )}&search_type=people`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find first user result
    const firstResult = $(".searchResult.user").first();
    const profileUrl = firstResult.find("a.userProfileImage").attr("href");
    const username = firstResult.find(".userTitle").text().trim();

    if (profileUrl) {
      const userIdMatch = profileUrl.match(/\/user\/show\/(\d+)/);
      if (userIdMatch) {
        return {
          userId: userIdMatch[1],
          username: username || query,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error searching Goodreads user:", error);
    return null;
  }
}
