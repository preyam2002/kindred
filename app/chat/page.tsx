"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Chat } from "@/components/chat";
import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
          setErrorMessage(null);
        } else {
          const data = await res.json().catch(() => null);
          if (data?.missingTables) {
            setErrorMessage(data.error);
          } else {
            setErrorMessage(data?.error || "Failed to load conversations.");
          }
          setConversations([]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setErrorMessage("Failed to load conversations. Check the console for details.");
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchConversations();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/auth/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              AI Assistant
            </h2>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setSelectedConversation(undefined)}
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask me anything about your media taste!
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {errorMessage ? (
            <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
              <p>{errorMessage}</p>
              <p className="text-xs">
                Run the SQL migration at <code className="font-mono">lib/db/migrations/add_conversations_and_messages.sql</code> in your Supabase project, then reload this page.
              </p>
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversation === conv.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <div className="font-medium text-sm truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet
              <br />
              Start chatting to begin!
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Chat
          conversationId={selectedConversation}
          disabled={Boolean(errorMessage)}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
