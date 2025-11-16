import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize poster URLs to absolute URLs
 * Handles relative URLs from Letterboxd and other sources
 */
export function normalizePosterUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  
  // If already absolute URL, use as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // If relative URL starting with /, prepend letterboxd.com
  if (url.startsWith("/")) {
    return `https://letterboxd.com${url}`;
  }
  
  // Otherwise, assume it's a relative path and prepend letterboxd.com
  return `https://letterboxd.com/${url}`;
}

/**
 * Get the frontend origin from request headers
 * This ensures redirect URIs use the actual frontend host, not the backend host
 */
export function getFrontendOrigin(request: NextRequest): string {
  // Check for x-forwarded-host header (common in proxy/load balancer setups)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // Check for host header
  const host = request.headers.get("host");
  if (host) {
    const protocol = request.headers.get("x-forwarded-proto") || 
                    (request.url.startsWith("https") ? "https" : "http");
    return `${protocol}://${host}`;
  }
  
  // Fall back to NEXTAUTH_URL if available
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Last resort: extract origin from request.url
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch {
    // If all else fails, return empty string (shouldn't happen)
    return "";
  }
}
