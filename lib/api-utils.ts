// Shared API route utilities: rate limiting, auth, error handling

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type RateLimitTier = keyof typeof RATE_LIMITS;

interface ApiHandlerOptions {
  rateLimit?: RateLimitTier;
  requireAuth?: boolean;
}

/**
 * Extract a stable identifier for rate limiting from request headers
 */
function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Wrapper for API route handlers that provides:
 * - Rate limiting
 * - Authentication check
 * - Structured error handling
 */
interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
}

export function apiHandler(
  handler: (request: Request, user: SessionUser) => Promise<Response>,
  options: ApiHandlerOptions = {}
) {
  const { rateLimit: rateLimitTier = "default", requireAuth = true } = options;

  return async (request: Request): Promise<Response> => {
    const routePath = new URL(request.url).pathname;

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitKey = `${clientId}:${routePath}`;
    const rateLimitConfig = RATE_LIMITS[rateLimitTier];
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);

    if (!rateLimitResult.success) {
      logger.warn(`Rate limited: ${clientId} on ${routePath}`, "rate-limit");
      return rateLimitResponse(rateLimitResult);
    }

    // Authentication
    const session = await auth();
    const user: SessionUser | null =
      session?.user?.id && session?.user?.email
        ? { id: session.user.id as string, email: session.user.email as string, name: session.user.name }
        : null;

    if (requireAuth && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const response = await handler(request, user || { id: "", email: "", name: null });
      const headers = getRateLimitHeaders(rateLimitResult);
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
      return response;
    } catch (error) {
      logger.error(`API error: ${routePath}`, routePath, error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
