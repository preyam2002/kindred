// Letterboxd CSV export parser
// Based on Letterboxd's import format: https://letterboxd.com/about/importing-data/

export interface LetterboxdCSVRow {
  Title: string;
  Year?: string;
  Rating?: string;
  WatchedDate?: string;
  Review?: string;
  Tags?: string;
  DiaryDate?: string;
}

export interface ParsedLetterboxdFilm {
  title: string;
  year?: number;
  rating?: number; // 0.5 to 5 in 0.5 increments (we'll convert to 1-10)
  watchedDate?: Date;
  diaryDate?: Date;
  review?: string;
  tags?: string[];
}

/**
 * Parse CSV text into rows (reusing logic from Goodreads parser)
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
 * Parse Letterboxd CSV export
 */
export function parseLetterboxdCSV(csvText: string): ParsedLetterboxdFilm[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
  }

  // First row is headers
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const films: ParsedLetterboxdFilm[] = [];

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

    // Parse rating (Letterboxd uses 0.5 to 5 in 0.5 increments)
    let rating: number | undefined;
    const ratingStr = rowData["Rating"];
    if (ratingStr && ratingStr.trim() !== "") {
      const parsed = parseFloat(ratingStr);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 5) {
        rating = parsed;
      }
    }

    // Parse year
    let year: number | undefined;
    if (rowData["Year"]) {
      const yearStr = rowData["Year"].trim();
      if (yearStr) {
        const parsed = parseInt(yearStr);
        if (!isNaN(parsed) && parsed > 1880 && parsed <= new Date().getFullYear() + 10) {
          year = parsed;
        }
      }
    }

    // Parse dates (YYYY-MM-DD format)
    let watchedDate: Date | undefined;
    const watchedDateStr = rowData["WatchedDate"] || rowData["DiaryDate"];
    if (watchedDateStr && watchedDateStr.trim()) {
      const parsed = new Date(watchedDateStr.trim());
      if (!isNaN(parsed.getTime())) {
        watchedDate = parsed;
      }
    }

    let diaryDate: Date | undefined;
    if (rowData["DiaryDate"] && rowData["DiaryDate"] !== rowData["WatchedDate"]) {
      const parsed = new Date(rowData["DiaryDate"].trim());
      if (!isNaN(parsed.getTime())) {
        diaryDate = parsed;
      }
    }

    // Parse tags (comma-separated)
    const tags: string[] = [];
    if (rowData["Tags"]) {
      const tagList = rowData["Tags"].split(",").map((t) => t.trim());
      tags.push(...tagList.filter((t) => t !== ""));
    }

    const film: ParsedLetterboxdFilm = {
      title: rowData["Title"] || "",
      year,
      rating,
      watchedDate,
      diaryDate,
      review: rowData["Review"] || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (film.title) {
      films.push(film);
    }
  }

  return films;
}

