import { describe, it, expect, vi, beforeAll } from "vitest";

// Check if CLIENT_ID is set - tests will fail if not set
const hasClientId = !!process.env.MYANIMELIST_CLIENT_ID;
if (!hasClientId) {
  console.warn(
    "⚠️  MYANIMELIST_CLIENT_ID not set - tests will fail. Set it in .env.local to run tests."
  );
}

// Mock supabase to avoid initialization errors
vi.mock("@/lib/db/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock environment variables for Supabase (to prevent errors during import)
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "test_anon_key";

import { getMALAnimeList, getMALMangaList } from "../myanimelist";

describe("MyAnimeList Integration", () => {
  describe("getMALAnimeList", () => {
    it.skipIf(!hasClientId)(
      "should successfully fetch preyam's anime list",
      async () => {
        const username = "preyam";

        const animeData = await getMALAnimeList(username, 100, 0);

        // Basic structure
        expect(animeData).toBeDefined();
        expect(animeData).toHaveProperty("data");
        expect(Array.isArray(animeData.data)).toBe(true);

        // Should have anime items
        if (animeData.data.length > 0) {
          const firstAnime = animeData.data[0];
          expect(firstAnime).toHaveProperty("node");

          const anime = firstAnime.node;
          expect(anime).toHaveProperty("id");
          expect(anime).toHaveProperty("title");
          expect(anime.id).toBeGreaterThan(0);
          expect(anime.title).toBeTruthy();

          // Optional fields
          if (anime.main_picture) {
            expect(anime.main_picture).toHaveProperty("medium");
          }

          if (anime.genres) {
            expect(Array.isArray(anime.genres)).toBe(true);
          }

          // Check list status (if present)
          if (firstAnime.list_status) {
            const status = firstAnime.list_status;
            if (status.score !== undefined) {
              expect(status.score).toBeGreaterThanOrEqual(0);
              expect(status.score).toBeLessThanOrEqual(10);
            }
            if (status.status) {
              expect([
                "watching",
                "completed",
                "on_hold",
                "dropped",
                "plan_to_watch",
              ]).toContain(status.status);
            }
          }
        }

        console.log(
          `✅ Successfully fetched ${animeData.data.length} anime items for ${username}`
        );
        if (animeData.data.length > 0) {
          console.log(
            `Sample anime:`,
            animeData.data.slice(0, 5).map((item: any) => ({
              id: item.node.id,
              title: item.node.title,
              status: item.list_status?.status,
              score: item.list_status?.score,
              hasPicture: !!item.node.main_picture,
              genres: item.node.genres?.map((g: any) => g.name) || [],
            }))
          );
        }
      },
      30000
    ); // 30 second timeout for network requests

    it.skipIf(!hasClientId)(
      "should handle pagination correctly",
      async () => {
        const username = "preyam";

        const firstPage = await getMALAnimeList(username, 10, 0);
        const secondPage = await getMALAnimeList(username, 10, 10);

        expect(firstPage.data).toBeDefined();
        expect(secondPage.data).toBeDefined();

        // If there are items on both pages, they should be different
        if (firstPage.data.length > 0 && secondPage.data.length > 0) {
          const firstPageIds = firstPage.data.map((item: any) => item.node.id);
          const secondPageIds = secondPage.data.map(
            (item: any) => item.node.id
          );
          const overlap = firstPageIds.filter((id: number) =>
            secondPageIds.includes(id)
          );
          expect(overlap.length).toBe(0); // No overlap between pages
        }
      },
      30000
    );

    it("should handle invalid username gracefully", async () => {
      const username = "this-user-does-not-exist-12345-invalid";

      await expect(getMALAnimeList(username, 10, 0)).rejects.toThrow();
    }, 30000);
  });

  describe("getMALMangaList", () => {
    it.skipIf(!hasClientId)(
      "should successfully fetch preyam's manga list",
      async () => {
        const username = "preyam";

        const mangaData = await getMALMangaList(username, 100, 0);

        // Basic structure
        expect(mangaData).toBeDefined();
        expect(mangaData).toHaveProperty("data");
        expect(Array.isArray(mangaData.data)).toBe(true);

        // Should have manga items (if user has manga)
        if (mangaData.data.length > 0) {
          const firstManga = mangaData.data[0];
          expect(firstManga).toHaveProperty("node");

          const manga = firstManga.node;
          expect(manga).toHaveProperty("id");
          expect(manga).toHaveProperty("title");
          expect(manga.id).toBeGreaterThan(0);
          expect(manga.title).toBeTruthy();

          // Optional fields
          if (manga.main_picture) {
            expect(manga.main_picture).toHaveProperty("medium");
          }

          if (manga.genres) {
            expect(Array.isArray(manga.genres)).toBe(true);
          }

          // Check list status (if present)
          if (firstManga.list_status) {
            const status = firstManga.list_status;
            if (status.score !== undefined) {
              expect(status.score).toBeGreaterThanOrEqual(0);
              expect(status.score).toBeLessThanOrEqual(10);
            }
            if (status.status) {
              expect([
                "reading",
                "completed",
                "on_hold",
                "dropped",
                "plan_to_read",
              ]).toContain(status.status);
            }
          }
        }

        console.log(
          `✅ Successfully fetched ${mangaData.data.length} manga items for ${username}`
        );
        if (mangaData.data.length > 0) {
          console.log(
            `Sample manga:`,
            mangaData.data.slice(0, 5).map((item: any) => ({
              id: item.node.id,
              title: item.node.title,
              status: item.list_status?.status,
              score: item.list_status?.score,
              hasPicture: !!item.node.main_picture,
              genres: item.node.genres?.map((g: any) => g.name) || [],
            }))
          );
        }
      },
      30000
    );

    it.skipIf(!hasClientId)(
      "should handle invalid username gracefully",
      async () => {
        const username = "this-user-does-not-exist-12345-invalid";

        await expect(getMALMangaList(username, 10, 0)).rejects.toThrow();
      },
      30000
    );
  });

  describe("API Response Structure", () => {
    it.skipIf(!hasClientId)(
      "should return properly structured anime data",
      async () => {
        const username = "preyam";
        const animeData = await getMALAnimeList(username, 5, 0);

        expect(animeData).toHaveProperty("data");
        expect(Array.isArray(animeData.data)).toBe(true);

        animeData.data.forEach((item: any, index: number) => {
          expect(item, `Item ${index} missing node`).toHaveProperty("node");

          const anime = item.node;
          expect(anime.id, `Anime ${index} missing id`).toBeDefined();
          expect(anime.title, `Anime ${index} missing title`).toBeDefined();

          // ID should be a number
          expect(typeof anime.id).toBe("number");
          expect(anime.id).toBeGreaterThan(0);

          // Title should be a string
          expect(typeof anime.title).toBe("string");
          expect(anime.title.length).toBeGreaterThan(0);
        });
      },
      30000
    );

    it.skipIf(!hasClientId)(
      "should return properly structured manga data",
      async () => {
        const username = "preyam";
        const mangaData = await getMALMangaList(username, 5, 0);

        expect(mangaData).toHaveProperty("data");
        expect(Array.isArray(mangaData.data)).toBe(true);

        mangaData.data.forEach((item: any, index: number) => {
          expect(item, `Item ${index} missing node`).toHaveProperty("node");

          const manga = item.node;
          expect(manga.id, `Manga ${index} missing id`).toBeDefined();
          expect(manga.title, `Manga ${index} missing title`).toBeDefined();

          // ID should be a number
          expect(typeof manga.id).toBe("number");
          expect(manga.id).toBeGreaterThan(0);

          // Title should be a string
          expect(typeof manga.title).toBe("string");
          expect(manga.title.length).toBeGreaterThan(0);
        });
      },
      30000
    );
  });
});
