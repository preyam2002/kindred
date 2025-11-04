// Goodreads CSV import utilities
import { supabase } from "@/lib/db/supabase";
import { parseGoodreadsCSV, type ParsedGoodreadsBook } from "./goodreads-csv";
import { fetchBookCover } from "@/lib/cover-images";

/**
 * Import Goodreads CSV data and sync to database
 */
export async function importGoodreadsCSV(
  userId: string,
  csvText: string,
  goodreadsProfileUrl?: string
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
    const books = parseGoodreadsCSV(csvText);

    if (books.length === 0) {
      throw new Error("No books found in CSV file");
    }

    // Get or create source record
    const { data: existingSource } = await supabase
      .from("sources")
      .select("id")
      .eq("user_id", userId)
      .eq("source_name", "goodreads")
      .single();

    if (existingSource) {
      // Update existing source
      await supabase
        .from("sources")
        .update({
          source_user_id: goodreadsProfileUrl || "",
          access_token: goodreadsProfileUrl || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);
    } else {
      // Create new source
      await supabase.from("sources").insert({
        user_id: userId,
        source_name: "goodreads",
        source_user_id: goodreadsProfileUrl || "",
        access_token: goodreadsProfileUrl || "",
      });
    }

    let imported = 0;
    let errors = 0;

    // Step 1: Batch check which books already exist
    const bookIds = books.map(b => b.bookId);
    const { data: existingBooks } = await supabase
      .from("books")
      .select("id, source_item_id, poster_url")
      .eq("source", "goodreads")
      .in("source_item_id", bookIds);

    const existingBookMap = new Map(
      (existingBooks || []).map(item => [item.source_item_id, item])
    );

    // Step 2: Prepare new books and user_media records
    const newBooks: Array<{
      source: string;
      source_item_id: string;
      title: string;
      author?: string;
      isbn?: string;
      poster_url?: string;
    }> = [];
    
    const bookMap = new Map<string, { id: string; needsCover: boolean }>();
    const userMediaRecords: Array<{
      user_id: string;
      media_type: string;
      media_id: string;
      rating?: number;
      timestamp: Date;
      tags?: string[];
    }> = [];

    // Step 3: Prepare data for all books (parallel cover fetching for missing covers)
    const booksNeedingCovers: Array<{ book: ParsedGoodreadsBook; mediaId: string }> = [];

    for (const book of books) {
      const existing = existingBookMap.get(book.bookId);
      
      if (existing) {
        bookMap.set(book.bookId, { id: existing.id, needsCover: !existing.poster_url });
        if (!existing.poster_url) {
          booksNeedingCovers.push({ book, mediaId: existing.id });
        }
      } else {
        newBooks.push({
          source: "goodreads",
          source_item_id: book.bookId,
          title: book.title,
          author: book.author,
          isbn: book.isbn || book.isbn13,
        });
      }
    }

    // Step 4: Fetch covers in parallel for items that need them (limit concurrency)
    const BATCH_SIZE = 10;
    const coverResults = new Map<string, string | undefined>();
    
    for (let i = 0; i < booksNeedingCovers.length; i += BATCH_SIZE) {
      const batch = booksNeedingCovers.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async ({ book, mediaId }) => {
          try {
            const coverResult = await fetchBookCover(book.title, book.author, book.isbn || book.isbn13);
            if (coverResult.poster_url) {
              coverResults.set(mediaId, coverResult.poster_url);
            }
          } catch (error) {
            // Continue without cover if fetch fails
          }
        })
      );
    }

    // Step 5: Fetch covers for new items (parallel)
    const newCovers = new Map<string, string | undefined>();
    for (let i = 0; i < newBooks.length; i += BATCH_SIZE) {
      const batch = newBooks.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item) => {
          const book = books.find(b => b.bookId === item.source_item_id);
          if (book) {
            try {
              const coverResult = await fetchBookCover(book.title, book.author, book.isbn || book.isbn13);
              if (coverResult.poster_url) {
                newCovers.set(item.source_item_id, coverResult.poster_url);
              }
            } catch (error) {
              // Continue without cover
            }
          }
        })
      );
    }

    // Add covers to new books
    newBooks.forEach(item => {
      const coverUrl = newCovers.get(item.source_item_id);
      if (coverUrl) {
        item.poster_url = coverUrl;
      }
    });

    // Step 6: Batch insert new books
    if (newBooks.length > 0) {
      const { data: insertedBooks, error: insertError } = await supabase
        .from("books")
        .insert(newBooks)
        .select("id, source_item_id");

      if (insertError) {
        console.error("Error batch inserting books:", insertError);
        errors += newBooks.length;
      } else {
        // Add new items to map
        insertedBooks?.forEach(item => {
          bookMap.set(item.source_item_id, { id: item.id, needsCover: false });
        });
      }
    }

    // Step 7: Batch update covers for existing items
    const coverUpdates = Array.from(coverResults.entries()).map(([mediaId, posterUrl]) => ({
      id: mediaId,
      poster_url: posterUrl,
    }));

    if (coverUpdates.length > 0) {
      // Update in batches
      for (let i = 0; i < coverUpdates.length; i += 100) {
        const batch = coverUpdates.slice(i, i + 100);
        await Promise.all(
          batch.map(update =>
            supabase
              .from("books")
              .update({ poster_url: update.poster_url })
              .eq("id", update.id)
          )
        );
      }
    }

    // Step 8: Prepare user_media records
    for (const book of books) {
      const bookItem = bookMap.get(book.bookId);
      if (!bookItem) {
        errors++;
        continue;
      }

      const timestamp = book.dateRead || book.dateAdded || new Date();
      const rating = book.rating && book.rating > 0 ? book.rating * 2 : undefined;

      userMediaRecords.push({
        user_id: userId,
        media_type: "book",
        media_id: bookItem.id,
        rating,
        timestamp,
        tags: book.bookshelves || undefined,
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
    console.error("Error importing Goodreads CSV:", error);
    throw error;
  }
}
