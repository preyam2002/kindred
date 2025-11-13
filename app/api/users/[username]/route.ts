import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { NotFoundError, UnauthorizedError, ValidationError, ForbiddenError, formatErrorResponse, withRetry } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        formatErrorResponse(new NotFoundError("User", "username required")),
        { status: 404 }
      );
    }

    // Fetch user with retry
    const user = await withRetry(async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !data) {
        throw new NotFoundError("User", username);
      }
      return data;
    });

    // Fetch user media with polymorphic joins
    const { data: userMedia, error: mediaError } = await supabase
      .from("user_media")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false });

    if (mediaError) {
      console.error("Error fetching user media:", mediaError);
      return NextResponse.json({
        user,
        media: [],
      });
    }

    // Fetch media items from their respective tables based on media_type
    const enrichedMedia = [];
    if (userMedia && userMedia.length > 0) {
      // Group by media_type for efficient querying
      const mediaByType = {
        book: [] as string[],
        anime: [] as string[],
        manga: [] as string[],
        movie: [] as string[],
        music: [] as string[],
      };

      userMedia.forEach((um: any) => {
        if (um.media_type && um.media_id) {
          mediaByType[um.media_type as keyof typeof mediaByType]?.push(um.media_id);
        }
      });

      // Fetch from each table
      const [books, anime, manga, movies, music] = await Promise.all([
        mediaByType.book.length > 0
          ? supabase.from("books").select("*").in("id", mediaByType.book)
          : { data: [], error: null },
        mediaByType.anime.length > 0
          ? supabase.from("anime").select("*").in("id", mediaByType.anime)
          : { data: [], error: null },
        mediaByType.manga.length > 0
          ? supabase.from("manga").select("*").in("id", mediaByType.manga)
          : { data: [], error: null },
        mediaByType.movie.length > 0
          ? supabase.from("movies").select("*").in("id", mediaByType.movie)
          : { data: [], error: null },
        mediaByType.music.length > 0
          ? supabase.from("music").select("*").in("id", mediaByType.music)
          : { data: [], error: null },
      ]);

      // Create a map of media_id -> media_item for quick lookup
      const mediaMap = new Map();

      // Map books
      if (books.data) {
        books.data.forEach((item: any) => {
          mediaMap.set(item.id, { ...item, type: "book" });
        });
      }
      // Map anime
      if (anime.data) {
        anime.data.forEach((item: any) => {
          mediaMap.set(item.id, { ...item, type: "anime" });
        });
      }
      // Map manga
      if (manga.data) {
        manga.data.forEach((item: any) => {
          mediaMap.set(item.id, { ...item, type: "manga" });
        });
      }
      // Map movies
      if (movies.data) {
        movies.data.forEach((item: any) => {
          mediaMap.set(item.id, { ...item, type: "movie" });
        });
      }
      // Map music
      if (music.data) {
        music.data.forEach((item: any) => {
          mediaMap.set(item.id, { ...item, type: "music" });
        });
      }

      // Combine user_media with media items
      enrichedMedia.push(
        ...userMedia.map((um: any) => {
          const mediaItem = mediaMap.get(um.media_id);
          return {
            ...um,
            media_items: mediaItem || null,
          };
        })
      );
    }

    return NextResponse.json({
      user,
      media: enrichedMedia,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as any).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError()),
        { status: 401 }
      );
    }

    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("Username is required")),
        { status: 400 }
      );
    }

    // Get current user to verify ownership
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", session.user.id)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError("User not found")),
        { status: 401 }
      );
    }

    // Check if user is updating their own profile
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        formatErrorResponse(new NotFoundError("User", username)),
        { status: 404 }
      );
    }

    if (targetUser.id !== session.user.id) {
      return NextResponse.json(
        formatErrorResponse(new ForbiddenError("You can only update your own profile")),
        { status: 403 }
      );
    }

    // Parse update data
    const body = await request.json();
    const { avatar, bio, username: newUsername } = body;

    // Validate inputs
    const updateData: { avatar?: string; bio?: string; username?: string } = {};

    if (avatar !== undefined) {
      if (typeof avatar !== "string" || (avatar && avatar.length > 0 && avatar.length > 2048)) {
        return NextResponse.json(
          formatErrorResponse(new ValidationError("Avatar must be a valid URL (max 2048 characters)")),
          { status: 400 }
        );
      }
      updateData.avatar = avatar || undefined;
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || (bio && bio.length > 500)) {
        return NextResponse.json(
          formatErrorResponse(new ValidationError("Bio must be a string (max 500 characters)")),
          { status: 400 }
        );
      }
      updateData.bio = bio || undefined;
    }

    if (newUsername !== undefined) {
      if (typeof newUsername !== "string" || newUsername.length < 3 || newUsername.length > 50) {
        return NextResponse.json(
          formatErrorResponse(new ValidationError("Username must be between 3 and 50 characters")),
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      if (newUsername !== username) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("username", newUsername)
          .single();

        if (existingUser) {
          return NextResponse.json(
            formatErrorResponse(new ValidationError("Username is already taken")),
            { status: 409 }
          );
        }
      }

      updateData.username = newUsername;
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        formatErrorResponse(new ValidationError("Failed to update profile")),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as any).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

