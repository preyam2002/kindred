import { describe, it, expect } from "vitest";
import { scrapeLetterboxdProfile } from "../letterboxd-scraper";

describe("Letterboxd Scraper", () => {
  describe("scrapeLetterboxdProfile", () => {
    it("should successfully scrape preyam profile and find films", async () => {
      const username = "preyam";

      const profile = await scrapeLetterboxdProfile(username);

      // Basic profile structure
      expect(profile).toBeDefined();
      expect(profile.username).toBe(username);
      expect(profile.displayName).toBeDefined();
      expect(Array.isArray(profile.films)).toBe(true);
      expect(profile.totalFilms).toBeGreaterThan(0);

      // Should have films
      expect(profile.films.length).toBeGreaterThan(0);

      // Check film structure
      if (profile.films.length > 0) {
        const firstFilm = profile.films[0];
        expect(firstFilm).toHaveProperty("title");
        expect(firstFilm).toHaveProperty("filmId");
        expect(firstFilm.title).toBeTruthy();
        expect(firstFilm.filmId).toBeTruthy();

        // Optional fields
        if (firstFilm.rating !== undefined) {
          expect(firstFilm.rating).toBeGreaterThanOrEqual(0.5);
          expect(firstFilm.rating).toBeLessThanOrEqual(5);
        }

        if (firstFilm.posterUrl) {
          expect(typeof firstFilm.posterUrl).toBe("string");
          expect(firstFilm.posterUrl.length).toBeGreaterThan(0);
        }
      }

      console.log(
        `✅ Successfully scraped ${profile.totalFilms} films for ${username}`
      );
      console.log(`Display name: ${profile.displayName}`);
      console.log(
        `Sample films:`,
        profile.films.slice(0, 5).map((f) => ({
          title: f.title,
          filmId: f.filmId,
          rating: f.rating,
          hasPoster: !!f.posterUrl,
        }))
      );
    }, 30000); // 30 second timeout for network requests

    it("should handle invalid username gracefully", async () => {
      const username = "this-user-does-not-exist-12345";

      await expect(scrapeLetterboxdProfile(username)).rejects.toThrow();
    }, 30000);

    it("should extract film data correctly", async () => {
      const username = "preyam";

      const profile = await scrapeLetterboxdProfile(username);

      // Verify all films have required fields
      profile.films.forEach((film, index) => {
        expect(film.title, `Film ${index} missing title`).toBeTruthy();
        expect(film.filmId, `Film ${index} missing filmId`).toBeTruthy();

        // Film ID should be a slug (no spaces, lowercase)
        expect(film.filmId).toMatch(/^[a-z0-9-]+$/);
      });

      // Check for duplicates
      const filmIds = profile.films.map((f) => f.filmId);
      const uniqueIds = new Set(filmIds);
      expect(uniqueIds.size).toBe(filmIds.length);
    }, 30000);
  });
});
