// Goodreads CSV export parser
import { supabase } from "@/lib/db/supabase";

export interface GoodreadsCSVRow {
  "Book Id": string;
  Title: string;
  Author: string;
  "Author l-f": string;
  "Additional Authors": string;
  ISBN: string;
  ISBN13: string;
  "My Rating": string;
  "Average Rating": string;
  Publisher: string;
  Binding: string;
  "Number of Pages": string;
  "Year Published": string;
  "Original Publication Year": string;
  "Date Read": string;
  "Date Added": string;
  Bookshelves: string;
  "Bookshelves with positions": string;
  "Exclusive Shelf": string;
  "My Review": string;
  Spoiler: string;
  "Private Notes": string;
  "Read Count": string;
  "Recommended For": string;
  "Recommended By": string;
  "Owned Copies": string;
  "Original Purchase Date": string;
  "Original Purchase Location": string;
  "Condition": string;
  "Condition Description": string;
  "BCID": string;
}

export interface ParsedGoodreadsBook {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  rating?: number;
  dateRead?: Date;
  dateAdded?: Date;
  bookshelves?: string[];
  review?: string;
  exclusiveShelf?: string;
}

/**
 * Parse CSV text into rows
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Line separator
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        currentField = "";
      }
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
      // Skip \r\n
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  // Add last field and line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse Goodreads CSV export
 */
export function parseGoodreadsCSV(csvText: string): ParsedGoodreadsBook[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
  }

  // First row is headers
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const books: ParsedGoodreadsBook[] = [];

  for (const row of dataRows) {
    if (row.length < headers.length) {
      // Pad row if needed
      while (row.length < headers.length) {
        row.push("");
      }
    }

    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || "";
    });

    // Parse rating (can be empty or 0-5)
    let rating: number | undefined;
    const ratingStr = rowData["My Rating"];
    if (ratingStr && ratingStr.trim() !== "") {
      const parsed = parseInt(ratingStr);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        rating = parsed;
      }
    }

    // Parse dates
    let dateRead: Date | undefined;
    if (rowData["Date Read"]) {
      const dateStr = rowData["Date Read"].trim();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateRead = parsed;
        }
      }
    }

    let dateAdded: Date | undefined;
    if (rowData["Date Added"]) {
      const dateStr = rowData["Date Added"].trim();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateAdded = parsed;
        }
      }
    }

    // Parse bookshelves (comma-separated)
    const bookshelves: string[] = [];
    if (rowData["Bookshelves"]) {
      const shelves = rowData["Bookshelves"].split(",").map((s) => s.trim());
      bookshelves.push(...shelves.filter((s) => s !== ""));
    }

    const book: ParsedGoodreadsBook = {
      bookId: rowData["Book Id"] || "",
      title: rowData["Title"] || "",
      author: rowData["Author"] || "",
      isbn: rowData["ISBN"] || undefined,
      isbn13: rowData["ISBN13"] || undefined,
      rating,
      dateRead,
      dateAdded,
      bookshelves: bookshelves.length > 0 ? bookshelves : undefined,
      review: rowData["My Review"] || undefined,
      exclusiveShelf: rowData["Exclusive Shelf"] || undefined,
    };

    if (book.bookId && book.title) {
      books.push(book);
    }
  }

  return books;
}

