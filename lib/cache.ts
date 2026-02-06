// In-memory cache with TTL to prevent rate limiting on external APIs
// Used for MyAnimeList, Spotify, and other third-party API calls

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 3600) {
    this.store = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.store.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Global cache instance
const cache = new Cache(3600); // 1 hour default TTL

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Wrapper function to cache API calls
 * Automatically handles cache retrieval and storage
 *
 * @param key - Unique cache key
 * @param fetcher - Function that fetches the data
 * @param ttlSeconds - Optional custom TTL in seconds
 * @returns The cached or freshly fetched data
 *
 * @example
 * const animeData = await cachedFetch(
 *   `mal:anime:${id}`,
 *   () => fetchAnimeFromMAL(id),
 *   7200 // 2 hours
 * );
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`[Cache HIT] ${key}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`[Cache MISS] ${key}`);
  const data = await fetcher();

  // Store in cache
  cache.set(key, data, ttlSeconds);

  return data;
}

/**
 * Invalidate cache entries by key or pattern
 */
export function invalidateCache(keyOrPattern: string, isPattern: boolean = false): void {
  if (isPattern) {
    cache.deletePattern(keyOrPattern);
    console.log(`[Cache INVALIDATE PATTERN] ${keyOrPattern}`);
  } else {
    cache.delete(keyOrPattern);
    console.log(`[Cache INVALIDATE] ${keyOrPattern}`);
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
  console.log("[Cache CLEARED]");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return cache.getStats();
}

/**
 * Predefined cache key generators for common use cases
 */
export const CacheKeys = {
  // MyAnimeList cache keys
  malAnime: (id: string) => `mal:anime:${id}`,
  malManga: (id: string) => `mal:manga:${id}`,
  malUserAnimeList: (username: string) => `mal:user:${username}:anime`,
  malUserMangaList: (username: string) => `mal:user:${username}:manga`,

  // Spotify cache keys
  spotifyTrack: (id: string) => `spotify:track:${id}`,
  spotifyAlbum: (id: string) => `spotify:album:${id}`,
  spotifyArtist: (id: string) => `spotify:artist:${id}`,
  spotifyUserPlaylists: (userId: string) => `spotify:user:${userId}:playlists`,
  spotifyUserTopTracks: (userId: string) => `spotify:user:${userId}:top_tracks`,

  // User-specific cache keys
  userLibrary: (userId: string) => `user:${userId}:library`,
  userRecommendations: (userId: string) => `user:${userId}:recommendations`,
  userMatches: (userId: string) => `user:${userId}:matches`,
  userTasteProfile: (userId: string) => `user:${userId}:taste_profile`,

  // Taste matching cache keys
  tasteMatch: (user1Id: string, user2Id: string) => {
    // Sort IDs to ensure consistent cache key regardless of order
    const [id1, id2] = [user1Id, user2Id].sort();
    return `taste_match:${id1}:${id2}`;
  },
};

export default cache;
