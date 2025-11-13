import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { updateMissingCovers, fetchBookCover, fetchMoviePoster } from "@/lib/cover-images";
import { UnauthorizedError, formatErrorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError()),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type"); // "book", "movie", or null for all

    // Get media items missing cover images
    let query = supabase
      .from("media_items")
      .select("id, title, type, source_item_id, source")
      .is("poster_url", null)
      .limit(limit);

    if (type) {
      query = query.eq("type", type);
    }

    const { data: mediaItems, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch media items" },
        { status: 500 }
      );
    }

    if (!mediaItems || mediaItems.length === 0) {
      return NextResponse.json({
        message: "No media items missing cover images",
        updated: 0,
        errors: 0,
      });
    }

    // Update missing covers
    const result = await updateMissingCovers(mediaItems);

    return NextResponse.json({
      message: `Updated ${result.updated} cover images`,
      updated: result.updated,
      errors: result.errors,
      total: mediaItems.length,
    });
  } catch (error) {
    console.error("Error updating cover images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch a single cover image
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError()),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");
    const type = searchParams.get("type");
    const title = searchParams.get("title");
    const author = searchParams.get("author");
    const year = searchParams.get("year");
    const isbn = searchParams.get("isbn");

    if (!mediaId || !type || !title) {
      return NextResponse.json(
        { error: "Missing required parameters: mediaId, type, title" },
        { status: 400 }
      );
    }

    let coverResult;

    if (type === "book") {
      coverResult = await fetchBookCover(title, author || undefined, isbn || undefined);
    } else if (type === "movie") {
      const yearNum = year ? parseInt(year) : undefined;
      coverResult = await fetchMoviePoster(title, yearNum);
    } else {
      return NextResponse.json(
        { error: "Unsupported media type. Use 'book' or 'movie'" },
        { status: 400 }
      );
    }

    if (coverResult.poster_url) {
      // Update the media item with the cover URL
      const { error: updateError } = await supabase
        .from("media_items")
        .update({ poster_url: coverResult.poster_url })
        .eq("id", mediaId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update media item" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      poster_url: coverResult.poster_url,
      updated: !!coverResult.poster_url,
    });
  } catch (error) {
    console.error("Error fetching cover image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



