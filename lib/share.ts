// Share utilities for mash results

/**
 * Generate share text for mash results
 */
export function generateShareText(
  user1Name: string,
  user2Name: string,
  score: number,
  sharedCount: number
): string {
  return `Just discovered our ${score}% compatibility on @kindred! 🎬📚🎵

We have ${sharedCount} shared favorites!

Check our compatibility:`;
}

/**
 * Generate mash URL
 */
export function generateMashUrl(
  user1Name: string,
  user2Name: string,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  return `${baseUrl}/${user1Name}/${user2Name}`;
}

/**
 * Generate full tweet text with link
 */
export function generateTweetText(
  user1Name: string,
  user2Name: string,
  score: number,
  sharedCount: number,
  baseUrl?: string
): string {
  const shareText = generateShareText(user1Name, user2Name, score, sharedCount);
  const url = generateMashUrl(user1Name, user2Name, baseUrl);
  return `${shareText} ${url}`;
}

/**
 * Generate Twitter share URL
 */
export function generateTwitterShareUrl(
  text: string,
  url: string
): string {
  const tweetText = encodeURIComponent(text);
  const tweetUrl = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}


