// LLM-powered insights generation using Anthropic Claude
import Anthropic from "@anthropic-ai/sdk";
import type { MashScoreResult } from "./matching";
import type { User } from "@/types/database";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface CompatibilityInsight {
  summary: string;
  highlights: string[];
  patterns: string[];
  recommendations?: string[];
}

/**
 * Generate AI-powered insights about user compatibility
 * Analyzes shared media, ratings, and patterns to provide personalized insights
 */
export async function generateCompatibilityInsights(
  user1: User,
  user2: User,
  mashResult: MashScoreResult
): Promise<CompatibilityInsight> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Return fallback insights if API key not configured
    return generateFallbackInsights(mashResult);
  }

  try {
    // Prepare data for LLM
    const sharedItems = mashResult.sharedItems.slice(0, 20); // Limit to top 20 for context
    const sharedItemsText = sharedItems
      .map((item) => {
        const ratings = [];
        if (item.user1Rating) ratings.push(`${user1.username}: ${item.user1Rating}/10`);
        if (item.user2Rating) ratings.push(`${user2.username}: ${item.user2Rating}/10`);
        return `- "${item.media.title}" (${item.media.type}) - ${ratings.join(", ")}`;
      })
      .join("\n");

    const topRatedShared = sharedItems
      .filter((item) => (item.user1Rating || 0) >= 8 || (item.user2Rating || 0) >= 8)
      .slice(0, 5)
      .map((item) => item.media.title)
      .join(", ");

    const recommendations = mashResult.recommendations
      .slice(0, 5)
      .map((rec) => `- "${rec.media.title}" (${rec.media.type})`)
      .join("\n");

    const prompt = `You are analyzing the media compatibility between two users on Kindred, a platform that connects people through their shared media tastes.

User 1: @${user1.username}
User 2: @${user2.username}

Compatibility Score: ${mashResult.score}%
Shared Items: ${mashResult.sharedCount}

Shared Media Items:
${sharedItemsText || "No shared items"}

Top Highly-Rated Shared Items: ${topRatedShared || "None"}

Recommendations (items User 2 has that User 1 might like):
${recommendations || "None"}

Generate personalized insights about their compatibility. Focus on:
1. A brief summary (2-3 sentences) highlighting their compatibility level and what makes them compatible
2. 3-5 specific highlights (fun facts, interesting patterns, notable shared items or ratings)
3. 2-3 patterns you notice (rating styles, genre preferences, taste evolution)
4. Optional: 2-3 personalized recommendations based on their shared tastes

Keep the tone friendly, engaging, and specific. Avoid generic statements. Reference specific titles when interesting.

Format your response as JSON with this structure:
{
  "summary": "brief summary text",
  "highlights": ["highlight 1", "highlight 2", ...],
  "patterns": ["pattern 1", "pattern 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const content = message.content[0];
    if (content.type === "text") {
      // Try to parse JSON from the response
      const text = content.text;
      
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      
      try {
        const parsed = JSON.parse(jsonText);
        return {
          summary: parsed.summary || generateFallbackSummary(mashResult),
          highlights: parsed.highlights || [],
          patterns: parsed.patterns || [],
          recommendations: parsed.recommendations || [],
        };
      } catch (parseError) {
        console.error("Failed to parse LLM response as JSON:", parseError);
        // Try to extract insights from text
        return extractInsightsFromText(text, mashResult);
      }
    }

    return generateFallbackInsights(mashResult);
  } catch (error) {
    console.error("Error generating insights with Anthropic:", error);
    return generateFallbackInsights(mashResult);
  }
}

/**
 * Extract insights from LLM text response when JSON parsing fails
 */
function extractInsightsFromText(
  text: string,
  mashResult: MashScoreResult
): CompatibilityInsight {
  const lines = text.split("\n").filter((line) => line.trim());
  
  // Try to find summary (usually first paragraph)
  const summary = lines.slice(0, 3).join(" ").substring(0, 200);
  
  // Extract highlights (look for bullet points or numbered items)
  const highlights: string[] = [];
  let inHighlights = false;
  
  for (const line of lines) {
    if (line.match(/^(highlights?|fun facts?)/i)) {
      inHighlights = true;
      continue;
    }
    if (line.match(/^(patterns?|recommendations?)/i)) {
      break;
    }
    if (inHighlights && (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/))) {
      highlights.push(line.replace(/^[-•*\d.]\s*/, "").trim());
    }
  }

  return {
    summary: summary || generateFallbackSummary(mashResult),
    highlights: highlights.length > 0 ? highlights.slice(0, 5) : generateFallbackHighlights(mashResult),
    patterns: [],
    recommendations: [],
  };
}

/**
 * Generate fallback insights when LLM is unavailable
 */
function generateFallbackInsights(mashResult: MashScoreResult): CompatibilityInsight {
  const score = mashResult.score;
  const sharedCount = mashResult.sharedCount;
  
  let summary = "";
  if (score >= 80) {
    summary = `These two users have exceptional compatibility with ${score}% similarity! They share ${sharedCount} media items, showing remarkably aligned tastes.`;
  } else if (score >= 60) {
    summary = `Great compatibility! ${score}% similarity with ${sharedCount} shared items suggests strong common interests.`;
  } else if (score >= 40) {
    summary = `Moderate compatibility at ${score}% with ${sharedCount} shared items. There's common ground but also room for discovery.`;
  } else {
    summary = `${score}% compatibility with ${sharedCount} shared items. Different tastes create opportunities for new discoveries!`;
  }

  const highlights: string[] = [];
  
  // Find highly rated shared items
  const topRated = mashResult.sharedItems
    .filter((item) => (item.user1Rating || 0) >= 8 && (item.user2Rating || 0) >= 8)
    .slice(0, 3);
  
  if (topRated.length > 0) {
    highlights.push(
      `Both users highly rated: ${topRated.map((item) => item.media.title).join(", ")}`
    );
  }

  // Find similar ratings
  const similarRatings = mashResult.sharedItems.filter((item) => {
    if (!item.user1Rating || !item.user2Rating) return false;
    return Math.abs(item.user1Rating - item.user2Rating) <= 1;
  });

  if (similarRatings.length > 5) {
    highlights.push(
      `Similar rating styles: ${similarRatings.length} items rated within 1 point of each other`
    );
  }

  if (mashResult.recommendations.length > 0) {
    highlights.push(
      `${mashResult.recommendations.length} recommendations based on shared tastes`
    );
  }

  return {
    summary,
    highlights: highlights.length > 0 ? highlights : ["Shared ${sharedCount} media items"],
    patterns: [],
    recommendations: [],
  };
}

function generateFallbackSummary(mashResult: MashScoreResult): string {
  return generateFallbackInsights(mashResult).summary;
}

function generateFallbackHighlights(mashResult: MashScoreResult): string[] {
  return generateFallbackInsights(mashResult).highlights;
}




