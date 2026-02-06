import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import { fetchMediaItemsForUserMedia } from "@/lib/db/media-helpers";
import type { UserMedia } from "@/types/database";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const CHAT_MIGRATION_FILE = "lib/db/migrations/add_conversations_and_messages.sql";

interface SupabaseError {
  code?: string;
  message?: string;
  status?: number;
}

function isMissingChatTables(error: unknown): boolean {
  return Boolean((error as SupabaseError)?.code === "PGRST205");
}

function missingChatTablesResponse(context: string) {
  return NextResponse.json(
    {
      error:
        "AI chat tables are not set up in Supabase. Please run the SQL migration at lib/db/migrations/add_conversations_and_messages.sql and restart the app.",
      missingTables: true,
      migrationFile: CHAT_MIGRATION_FILE,
      context,
    },
    { status: 503 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create conversation
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        })
        .select()
        .single();

      if (createError || !newConversation) {
        console.error("Error creating conversation:", createError);
        if (isMissingChatTables(createError)) {
          return missingChatTablesResponse("create_conversation");
        }
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      currentConversationId = newConversation.id;
    } else {
      // Verify conversation belongs to user
      const { data: conversation, error: verifyError } = await supabase
        .from("conversations")
        .select("user_id")
        .eq("id", currentConversationId)
        .single();

      if (verifyError) {
        if (isMissingChatTables(verifyError)) {
          return missingChatTablesResponse("verify_conversation");
        }
      }

      if (!conversation || conversation.user_id !== userId) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    // Store user message
    const { error: userMessageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: currentConversationId,
        role: "user",
        content: message,
      });

    if (userMessageError) {
      console.error("Error storing user message:", userMessageError);
      if (isMissingChatTables(userMessageError)) {
        return missingChatTablesResponse("store_user_message");
      }
      return NextResponse.json(
        { error: "Failed to store message" },
        { status: 500 }
      );
    }

    // Get conversation history
    const { data: messageHistory, error: historyError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("Error fetching message history:", historyError);
      if (isMissingChatTables(historyError)) {
        return missingChatTablesResponse("fetch_history");
      }
      return NextResponse.json(
        { error: "Failed to fetch conversation history" },
        { status: 500 }
      );
    }

    // Get user context (their media, profile, etc.)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username, bio")
      .eq("id", userId)
      .single();

    // Get user's media stats
    const { data: userMediaRecords, error: mediaError } = await supabase
      .from("user_media")
      .select("media_type, media_id, rating")
      .eq("user_id", userId)
      .order("rating", { ascending: false })
      .limit(50); // Get top 50 rated items

    // Fetch the actual media items using the helper function
    const mediaMap = userMediaRecords
      ? await fetchMediaItemsForUserMedia(userMediaRecords as unknown as UserMedia[])
      : new Map();

    // Combine user_media records with their media items
    const userMedia = userMediaRecords
      ? userMediaRecords.map((um) => ({
          media_type: um.media_type,
          rating: um.rating,
          media_item: mediaMap.get(um.media_id),
        }))
      : [];

    // Get user's matches
    const { data: matches } = await supabase
      .from("matches")
      .select("similarity_score")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("similarity_score", { ascending: false })
      .limit(10);

    // Get user's taste profile
    const { data: tasteProfile } = await supabase
      .from("taste_profiles")
      .select("*")
      .eq("user_email", session.user.email)
      .single();

    // Get recent challenge progress
    const { data: challengeProgress } = await supabase
      .from("user_streaks")
      .select("current_streak, total_points, level")
      .eq("user_email", session.user.email)
      .single();

    // Build context about the user
    const userContext = buildUserContext(
      userData,
      userMedia || [],
      matches || [],
      tasteProfile,
      challengeProgress
    );

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Prepare messages for OpenAI
    const systemPrompt = `You are a helpful AI assistant for Kindred, a social platform that connects people through their shared media tastes (books, anime, manga, movies, music).

The user you're talking to is @${userData?.username || "user"}.

${userContext}

Your role is to:
- Help users understand their media taste and compatibility with others
- Provide personalized recommendations based on their ratings and preferences
- Answer questions about their library, matches, and the platform
- Be friendly, engaging, and knowledgeable about media

When making recommendations, consider their actual ratings and preferences. When discussing matches, reference their compatibility scores and shared items.`;

    // Convert message history to OpenAI format
    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messageHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
        max_tokens: 2048,
      });
    } catch (apiError: unknown) {
      console.error("Error calling OpenAI API:", apiError);
      const errorMessage = (apiError as Error)?.message || "Unknown error";
      const isAuthError = errorMessage.includes("api key") || errorMessage.includes("authentication") || (apiError as { status?: number })?.status === 401;
      
      return NextResponse.json(
        { 
          error: isAuthError 
            ? "OpenAI API key is invalid or missing. Please check your configuration." 
            : `Failed to get AI response: ${errorMessage}` 
        },
        { status: 500 }
      );
    }

    // Extract assistant's response
    const assistantMessage = response.choices[0]?.message?.content || "";

    // Store assistant message
    const { error: assistantMessageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: currentConversationId,
        role: "assistant",
        content: assistantMessage,
      });

    if (assistantMessageError) {
      console.error("Error storing assistant message:", assistantMessageError);
      if (isMissingChatTables(assistantMessageError)) {
        return missingChatTablesResponse("store_assistant_message");
      }
      // Continue anyway - we can still return the response
    }

    return NextResponse.json({
      conversationId: currentConversationId,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get specific conversation with messages
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .single();

      if (convError || !conversation) {
        if (isMissingChatTables(convError)) {
          return missingChatTablesResponse("get_conversation");
        }
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Error fetching messages:", msgError);
        if (isMissingChatTables(msgError)) {
          return missingChatTablesResponse("get_messages");
        }
        return NextResponse.json(
          { error: "Failed to fetch messages" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        conversation,
        messages: messages || [],
      });
    } else {
      // Get all conversations for user
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        if (isMissingChatTables(error)) {
          return missingChatTablesResponse("list_conversations");
        }
        return NextResponse.json(
          { error: "Failed to fetch conversations" },
          { status: 500 }
        );
      }

      return NextResponse.json({ conversations: conversations || [] });
    }
  } catch (error) {
    console.error("Error in chat GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildUserContext(
  userData: any,
  userMedia: Array<{ media_type: string; rating: number | null; media_item: any }>,
  matches: any[],
  tasteProfile?: any,
  challengeProgress?: any
): string {
  let context = "";

  if (userData?.bio) {
    context += `User bio: "${userData.bio}"\n\n`;
  }

  // Taste Profile Information
  if (tasteProfile) {
    context += "TASTE PROFILE:\n";
    if (tasteProfile.top_genres && tasteProfile.top_genres.length > 0) {
      context += `Top Genres: ${tasteProfile.top_genres.join(", ")}\n`;
    }
    if (tasteProfile.mainstream_score !== undefined) {
      context += `Mainstream Score: ${tasteProfile.mainstream_score}% (how popular vs niche their taste is)\n`;
    }
    if (tasteProfile.diversity_score !== undefined) {
      context += `Diversity Score: ${tasteProfile.diversity_score}% (how varied their taste is across genres)\n`;
    }
    if (tasteProfile.rating_average !== undefined) {
      context += `Average Rating: ${tasteProfile.rating_average.toFixed(1)}/10\n`;
    }
    context += "\n";
  }

  // Challenge & Gamification Stats
  if (challengeProgress) {
    context += "GAMIFICATION PROGRESS:\n";
    if (challengeProgress.current_streak) {
      context += `Current Streak: ${challengeProgress.current_streak} days\n`;
    }
    if (challengeProgress.level) {
      context += `Level: ${challengeProgress.level}\n`;
    }
    if (challengeProgress.total_points) {
      context += `Total Points: ${challengeProgress.total_points}\n`;
    }
    context += "\n";
  }

  if (userMedia && userMedia.length > 0) {
    const mediaByType: Record<string, typeof userMedia> = {};
    userMedia.forEach((item) => {
      if (!mediaByType[item.media_type]) {
        mediaByType[item.media_type] = [];
      }
      mediaByType[item.media_type].push(item);
    });

    context += "LIBRARY (Top Rated):\n";
    for (const [type, items] of Object.entries(mediaByType)) {
      const typeLabel = type === "book" ? "Books" : type === "movie" ? "Movies" : type.charAt(0).toUpperCase() + type.slice(1);
      context += `\n${typeLabel}:\n`;
      items.slice(0, 10).forEach((item) => {
        const mediaItem = item.media_item;
        if (mediaItem) {
          const title = mediaItem.title || "Unknown";
          const rating = item.rating ? ` - ${item.rating}/10` : "";
          let extra = "";

          if (type === "book" && mediaItem.author) {
            extra = ` by ${mediaItem.author}`;
          } else if (type === "music" && mediaItem.artist) {
            extra = ` by ${mediaItem.artist}`;
          } else if (type === "movie" && mediaItem.year) {
            extra = ` (${mediaItem.year})`;
          }

          context += `  - ${title}${extra}${rating}\n`;
        }
      });
    }
    context += "\n";
  }

  if (matches && matches.length > 0) {
    const avgScore =
      matches.reduce((sum, m) => sum + m.similarity_score, 0) / matches.length;
    context += `SOCIAL:\n`;
    context += `${matches.length} taste matches with ${avgScore.toFixed(0)}% average compatibility\n`;
    context += `Best match: ${matches[0].similarity_score}% compatibility\n`;
  }

  return context;
}
