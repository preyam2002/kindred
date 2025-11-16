import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getAllRecommendations } from "@/lib/recommendations";
import { UnauthorizedError, ValidationError, formatErrorResponse, withRetry } from "@/lib/errors";

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
    const limitParam = searchParams.get("limit") || "20";
    const limit = parseInt(limitParam);

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError("Limit must be between 1 and 100")),
        { status: 400 }
      );
    }

    const recommendations = await withRetry(() =>
      getAllRecommendations(session.user.id, limit)
    );

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    const formatted = formatErrorResponse(error);
    const statusCode = error instanceof Error && "statusCode" in error 
      ? (error as { statusCode: number }).statusCode 
      : 500;

    return NextResponse.json(formatted, { status: statusCode });
  }
}

