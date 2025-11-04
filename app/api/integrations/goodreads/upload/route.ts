import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { importGoodreadsCSV } from "@/lib/integrations/goodreads";
import { UnauthorizedError, ValidationError, formatErrorResponse } from "@/lib/errors";
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError()),
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const profileUrl = formData.get("profileUrl") as string | null;

    if (!file) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("CSV file is required")),
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("File must be a CSV file")),
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("File size must be less than 10MB")),
        { status: 400 }
      );
    }

    // Read CSV content
    const csvText = await file.text();

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("CSV file is empty")),
        { status: 400 }
      );
    }

    // Verify user exists in database before importing
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      console.error("User not found in database:", session.user.id, userError);
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError("User account not found. Please sign out and sign in again.")),
        { status: 401 }
      );
    }

    // Import books
    const result = await importGoodreadsCSV(
      session.user.id,
      csvText,
      profileUrl || undefined
    );

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      message: `Successfully imported ${result.imported} books${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
    });
  } catch (error: any) {
    console.error("Error uploading Goodreads CSV:", error);
    
    // Check if it's a user not found error
    if (error.message?.includes("User not found")) {
      return NextResponse.json(
        formatErrorResponse(new UnauthorizedError("User account not found. Please sign out and sign in again.")),
        { status: 401 }
      );
    }
    
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as any).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

