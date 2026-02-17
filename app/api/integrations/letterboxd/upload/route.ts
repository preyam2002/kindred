import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { importLetterboxdCSV } from "@/lib/integrations/letterboxd";
import { UnauthorizedError, ValidationError, formatErrorResponse } from "@/lib/errors";
import AdmZip from "adm-zip";

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
        formatErrorResponse(new ValidationError("CSV or ZIP file is required")),
        { status: 400 }
      );
    }

    // Validate file type (accept CSV or ZIP)
    const isZip = file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";
    const isCsv = file.name.endsWith(".csv") || file.type === "text/csv";

    if (!isZip && !isCsv) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("File must be a CSV file or ZIP archive containing a CSV file")),
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

    // Read file content
    let csvText: string;
    
    if (isZip) {
      // Extract CSV from zip file
      const arrayBuffer = await file.arrayBuffer();
      const zip = new AdmZip(Buffer.from(arrayBuffer));
      const zipEntries = zip.getEntries();
      
      // Find the CSV file in the zip
      const csvEntry = zipEntries.find(entry => 
        entry.entryName.endsWith(".csv") && !entry.isDirectory
      );
      
      if (!csvEntry) {
        return NextResponse.json(
          formatErrorResponse(new ValidationError("ZIP file does not contain a CSV file")),
          { status: 400 }
        );
      }
      
      csvText = csvEntry.getData().toString("utf-8");
    } else {
      // Read CSV directly
      csvText = await file.text();
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("CSV file is empty")),
        { status: 400 }
      );
    }

    // Import films
    const result = await importLetterboxdCSV(
      session.user.id,
      csvText,
      profileUrl || undefined
    );

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      message: `Successfully imported ${result.imported} films${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
    });
  } catch (error) {
    console.error("Error uploading Letterboxd CSV:", error);
    const formatted = formatErrorResponse(error instanceof Error ? error : new Error("Upload failed"));
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as { statusCode?: number }).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

