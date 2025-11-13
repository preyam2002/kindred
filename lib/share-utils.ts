// Utility functions for generating shareable content

export interface ShareConfig {
  type: "match" | "profile" | "challenge" | "wrapped";
  url: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  via?: string;
  user1?: string;
  user2?: string;
  score?: number;
  sharedCount?: number;
}

/**
 * Generate share text for different platforms
 */
export function generateShareText(config: ShareConfig): string {
  const { type, user1, user2, score, sharedCount } = config;

  switch (type) {
    case "match":
      if (user1 && user2 && score !== undefined) {
        return `I'm ${score}% compatible with @${user2} on @kindred_app! ${
          sharedCount ? `We share ${sharedCount} items. ` : ""
        }Check your compatibility 👀`;
      }
      return "Check out my media compatibility on Kindred!";

    case "challenge":
      if (user1) {
        return `Think you know me? Check your compatibility with @${user1} on @kindred_app and see how well our tastes align! 🎯`;
      }
      return "Check your compatibility with me on Kindred!";

    case "profile":
      if (user1) {
        return `Check out my taste profile on @kindred_app! See what I'm into and find your media soulmate 🎬📚🎵`;
      }
      return "Check out my profile on Kindred!";

    case "wrapped":
      return "Just got my Kindred Wrapped! See my year in media and top matches 🔥";

    default:
      return "Check out Kindred - connect through what you love!";
  }
}

/**
 * Generate Twitter share URL
 */
export function getTwitterShareUrl(config: ShareConfig): string {
  const text = generateShareText(config);
  const hashtags = config.hashtags || ["Kindred", "MediaCompatibility"];
  const via = config.via || "kindred_app";

  const params = new URLSearchParams({
    text,
    url: config.url,
    hashtags: hashtags.join(","),
    via,
  });

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(config: ShareConfig): string {
  const params = new URLSearchParams({
    u: config.url,
  });

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(config: ShareConfig): string {
  const params = new URLSearchParams({
    url: config.url,
  });

  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(config: ShareConfig): string {
  const text = `${generateShareText(config)} ${config.url}`;
  const params = new URLSearchParams({
    text,
  });

  return `https://wa.me/?${params.toString()}`;
}

/**
 * Copy URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        textArea.remove();
        return true;
      } catch (error) {
        console.error("Fallback copy failed:", error);
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}

/**
 * Track share action
 */
export async function trackShare(
  shareType: string,
  platform: string,
  metadata?: any
): Promise<{ referralCode?: string; shareId?: string }> {
  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shareType,
        platform,
        metadata,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        referralCode: data.referralCode,
        shareId: data.shareId,
      };
    }
  } catch (error) {
    console.error("Failed to track share:", error);
  }

  return {};
}

/**
 * Get share URL with tracking parameters
 */
export function getShareUrl(
  baseUrl: string,
  referralCode?: string,
  shareId?: string
): string {
  const url = new URL(baseUrl, window.location.origin);

  if (referralCode) {
    url.searchParams.set("ref", referralCode);
  }

  if (shareId) {
    url.searchParams.set("shareId", shareId);
  }

  return url.toString();
}
