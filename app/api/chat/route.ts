import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/db/supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

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

      if (verifyError || !conversation || conversation.user_id !== userId) {
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
    const { data: userMedia } = await supabase
      .from("user_media")
      .select(`
        media_type,
        rating,
        books(title, author),
        anime(title),
        manga(title),
        movies(title, year),
        music(title, artist)
      `)
      .eq("user_id", userId)
      .order("rating", { ascending: false })
      .limit(50); // Get top 50 rated items

    // Get user's matches
    const { data: matches } = await supabase
      .from("matches")
      .select("similarity_score")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("similarity_score", { ascending: false })
      .limit(10);

    // Build context about the user
    const userContext = buildUserContext(userData, userMedia || [], matches || []);

    // Prepare messages for Claude
    const claudeMessages = messageHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Claude API
    const systemPrompt = `You are a helpful AI assistant for Kindred, a social platform that connects people through their shared media tastes (books, anime, manga, movies, music).

The user you're talking to is @${userData?.username || "user"}.

${userContext}

Your role is to:
- Help users understand their media taste and compatibility with others
- Provide personalized recommendations based on their ratings and preferences
- Answer questions about their library, matches, and the platform
- Be friendly, engaging, and knowledgeable about media

When making recommendations, consider their actual ratings and preferences. When discussing matches, reference their compatibility scores and shared items.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages as Anthropic.MessageParam[],
    });

    // Extract assistant's response
    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

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
  userMedia: any[],
  matches: any[]
): string {
  let context = "";

  if (userData?.bio) {
    context += `User bio: "${userData.bio}"\n\n`;
  }

  if (userMedia && userMedia.length > 0) {
    const mediaByType: Record<string, any[]> = {};
    userMedia.forEach((item) => {
      if (!mediaByType[item.media_type]) {
        mediaByType[item.media_type] = [];
      }
      mediaByType[item.media_type].push(item);
    });

    context += "User's media library:\n";
    for (const [type, items] of Object.entries(mediaByType)) {
      context += `\n${type.charAt(0).toUpperCase() + type.slice(1)} (top rated):\n`;
      items.slice(0, 10).forEach((item) => {
        const mediaData = item[type === "music" ? "music" : type];
        if (mediaData) {
          const title = mediaData.title || "Unknown";
          const rating = item.rating ? ` - ${item.rating}/10` : "";
          const extra =
            type === "books"
              ? ` by ${mediaData.author || "Unknown"}`
              : type === "music"
              ? ` by ${mediaData.artist || "Unknown"}`
              : type === "movies" && mediaData.year
              ? ` (${mediaData.year})`
              : "";
          context += `  - ${title}${extra}${rating}\n`;
        }
      });
    }
  }

  if (matches && matches.length > 0) {
    const avgScore =
      matches.reduce((sum, m) => sum + m.similarity_score, 0) / matches.length;
    context += `\nUser has ${matches.length} matches with an average compatibility score of ${avgScore.toFixed(0)}%.\n`;
    context += `Top match: ${matches[0].similarity_score}%\n`;
  }

  return context;
}
