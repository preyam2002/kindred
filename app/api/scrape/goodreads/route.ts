import { NextRequest, NextResponse } from "next/server";
import { scrapeGoodreadsProfile } from "@/lib/scrapers/goodreads-scraper";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, userId } = body;

    if (!username && !userId) {
      return NextResponse.json(
        { error: "Username or userId required" },
        { status: 400 }
      );
    }

    // Scrape Goodreads profile
    const profile = await scrapeGoodreadsProfile(username || userId);

    // Store books in database
    const insertedBooks = [];

    for (const book of profile.books) {
      // Check if book exists
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("source", "goodreads")
        .eq("source_item_id", book.bookId)
        .single();

      if (!existing && book.bookId) {
        // Insert new book
        const { data: newBook, error } = await supabase
          .from("books")
          .insert({
            source: "goodreads",
            source_item_id: book.bookId,
            title: book.title,
            author: book.author,
            poster_url: book.coverUrl,
          })
          .select()
          .single();

        if (!error && newBook) {
          insertedBooks.push({
            ...newBook,
            rating: book.rating,
            dateRead: book.dateRead,
          });
        }
      } else if (existing) {
        insertedBooks.push({
          ...existing,
          rating: book.rating,
          dateRead: book.dateRead,
        });
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        username: profile.username,
        userId: profile.userId,
        totalBooks: profile.totalBooks,
      },
      books: insertedBooks,
      scrapedCount: profile.books.length,
    });
  } catch (error) {
    console.error("Error in Goodreads scrape API:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape Goodreads profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for preview (no storage)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const userId = searchParams.get("userId");

    if (!username && !userId) {
      return NextResponse.json(
        { error: "Username or userId required" },
        { status: 400 }
      );
    }

    // Scrape Goodreads profile
    const profile = await scrapeGoodreadsProfile(username || userId || "");

    return NextResponse.json({
      success: true,
      username: profile.username,
      userId: profile.userId,
      totalBooks: profile.totalBooks,
      books: profile.books.slice(0, 20), // Return top 20 for preview
    });
  } catch (error) {
    console.error("Error in Goodreads preview API:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape Goodreads profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
