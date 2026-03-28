// Input validation utilities for API routes

import { NextResponse } from "next/server";

const VALID_MEDIA_TYPES = ["anime", "manga", "book", "movie", "music"] as const;
const VALID_PRIORITIES = ["low", "medium", "high"] as const;
const VALID_STATUSES = [
  "completed", "watching", "reading", "listening",
  "plan_to_watch", "plan_to_read", "plan_to_listen",
  "on_hold", "dropped",
] as const;

export type ValidMediaType = (typeof VALID_MEDIA_TYPES)[number];
export type ValidPriority = (typeof VALID_PRIORITIES)[number];

export function isValidMediaType(value: unknown): value is ValidMediaType {
  return typeof value === "string" && VALID_MEDIA_TYPES.includes(value as ValidMediaType);
}

export function isValidPriority(value: unknown): value is ValidPriority {
  return typeof value === "string" && VALID_PRIORITIES.includes(value as ValidPriority);
}

export function isValidStatus(value: unknown): boolean {
  return typeof value === "string" && VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number]);
}

export function isValidRating(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
}

export function isValidUUID(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidEmail(value: unknown): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function clampString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

interface ValidationError {
  field: string;
  message: string;
}

export function validationErrorResponse(errors: ValidationError[]) {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: 400 }
  );
}

export function singleValidationError(field: string, message: string) {
  return validationErrorResponse([{ field, message }]);
}

// Parse and validate request body safely
export async function parseBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ data: T | null; error: Response | null }> {
  try {
    const data = (await request.json()) as T;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}

// Map media type to Supabase table name
export function mediaTypeToTable(mediaType: string): string {
  const map: Record<string, string> = {
    anime: "anime",
    manga: "manga",
    book: "books",
    movie: "movies",
    music: "music",
  };
  return map[mediaType] || mediaType;
}
