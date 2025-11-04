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

    // Fetch user media
    const { data: userMedia, error: mediaError } = await supabase
      .from("user_media")
      .select("*, media_items(*)")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false });

    if (mediaError) {
      console.error("Error fetching user media:", mediaError);
      // Don't fail the whole request if media fetch fails
    }

    return NextResponse.json({
      user,
      media: userMedia || [],
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
      updateData.avatar = avatar || null;
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || (bio && bio.length > 500)) {
        return NextResponse.json(
          formatErrorResponse(new ValidationError("Bio must be a string (max 500 characters)")),
          { status: 400 }
        );
      }
      updateData.bio = bio || null;
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

