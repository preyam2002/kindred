import { describe, it, expect } from 'vitest';
import { scrapeGoodreadsProfile } from '../goodreads-scraper';

describe('Goodreads Scraper', () => {
  describe('scrapeGoodreadsProfile', () => {
    it('should successfully scrape preyam-rao profile and find books', async () => {
      const username = '44002045-preyam-rao';
      
      const profile = await scrapeGoodreadsProfile(username);
      
      // Basic profile structure
      expect(profile).toBeDefined();
      expect(profile.username).toBe(username);
      expect(profile.userId).toBeDefined();
      expect(Array.isArray(profile.books)).toBe(true);
      expect(profile.totalBooks).toBeGreaterThan(0);
      
      // Should have books
      expect(profile.books.length).toBeGreaterThan(0);
      
      // Check book structure
      if (profile.books.length > 0) {
        const firstBook = profile.books[0];
        expect(firstBook).toHaveProperty('title');
        expect(firstBook).toHaveProperty('author');
        expect(firstBook.title).toBeTruthy();
        expect(firstBook.author).toBeTruthy();
        
        // Book ID should be present if available
        if (firstBook.bookId) {
          expect(typeof firstBook.bookId).toBe('string');
          expect(firstBook.bookId.length).toBeGreaterThan(0);
        }
        
        // Optional fields
        if (firstBook.rating !== undefined && firstBook.rating !== null) {
          expect(Number.isNaN(firstBook.rating)).toBe(false);
          expect(firstBook.rating).toBeGreaterThanOrEqual(0);
          expect(firstBook.rating).toBeLessThanOrEqual(5);
        }
        
        if (firstBook.coverUrl) {
          expect(typeof firstBook.coverUrl).toBe('string');
          expect(firstBook.coverUrl.length).toBeGreaterThan(0);
        }
        
        if (firstBook.dateRead) {
          expect(typeof firstBook.dateRead).toBe('string');
        }
      }
      
      console.log(`✅ Successfully scraped ${profile.totalBooks} books for ${username}`);
      console.log(`User ID: ${profile.userId}`);
      console.log(`Sample books:`, profile.books.slice(0, 5).map(b => ({
        title: b.title,
        author: b.author,
        bookId: b.bookId,
        rating: b.rating,
        hasCover: !!b.coverUrl,
        dateRead: b.dateRead,
      })));
    }, 30000); // 30 second timeout for network requests
    
    it('should handle invalid username gracefully', async () => {
      const username = 'this-user-does-not-exist-12345-invalid';
      
      await expect(scrapeGoodreadsProfile(username)).rejects.toThrow();
    }, 30000);
    
    it('should extract book data correctly', async () => {
      const username = '44002045-preyam-rao';
      
      const profile = await scrapeGoodreadsProfile(username);
      
      // Verify all books have required fields
      profile.books.forEach((book, index) => {
        expect(book.title, `Book ${index} missing title`).toBeTruthy();
        expect(book.author, `Book ${index} missing author`).toBeTruthy();
        
        // Book ID should be numeric if present
        if (book.bookId) {
          expect(book.bookId).toMatch(/^\d+$/);
        }
      });
      
      // Check for duplicates (by bookId if available)
      const bookIds = profile.books
        .map(b => b.bookId)
        .filter(Boolean) as string[];
      if (bookIds.length > 0) {
        const uniqueIds = new Set(bookIds);
        expect(uniqueIds.size).toBe(bookIds.length);
      }
    }, 30000);
  });
});

