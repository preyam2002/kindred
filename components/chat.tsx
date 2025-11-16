"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatProps {
  conversationId?: string;
  initialMessages?: Message[];
  disabled?: boolean;
  errorMessage?: string | null;
}

export function Chat({
  conversationId,
  initialMessages = [],
  disabled = false,
  errorMessage: externalError,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(
    conversationId
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(externalError || null);

  useEffect(() => {
    setErrorMessage(externalError || null);
  }, [externalError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when conversationId changes
  useEffect(() => {
    async function loadMessages() {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        const response = await fetch(`/api/chat?conversationId=${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setCurrentConversationId(conversationId);
          setErrorMessage(null);
        } else {
          const data = await response.json().catch(() => null);
          if (data?.missingTables) {
            setErrorMessage(data.error);
          } else {
            setErrorMessage(data?.error || "Failed to load messages.");
          }
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
        setErrorMessage("Failed to load messages. Check the console for details.");
      }
    }

    if (!disabled) {
      loadMessages();
    }
  }, [conversationId, disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled || errorMessage) {
      return;
    }

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));

        const isQuotaError =
          response.status === 429 ||
          errorData?.code === "insufficient_quota" ||
          errorData?.type === "insufficient_quota" ||
          errorData?.error?.type === "insufficient_quota" ||
          errorData?.error?.code === "insufficient_quota";

        if (isQuotaError) {
          const quotaMessage =
            (typeof errorData?.error === "string" && errorData.error) ||
            errorData?.error?.message ||
            "We hit the current AI usage limit. Please try again in a bit or review billing limits.";

          const quotaResponse: Message = {
            id: `quota-${Date.now()}`,
            role: "assistant",
            content: quotaMessage,
            created_at: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, quotaResponse]);
          return;
        }

        if (errorData?.missingTables) {
          setErrorMessage(errorData.error);
        }

        const errorDetail =
          (typeof errorData?.error === "string" && errorData.error) ||
          errorData?.error?.message ||
          errorData?.message ||
          `Failed to send message (${response.status})`;

        throw new Error(errorDetail);
      }

      const data = await response.json();

      // Update conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Chat setup required
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {errorMessage}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Run the SQL migration at <code className="font-mono">lib/db/migrations/add_conversations_and_messages.sql</code> in your Supabase project, then reload the page.
              </p>
            </div>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Start a conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ask me anything about your media taste, recommendations, or
                matches!
              </p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-500 space-y-1">
                <p>Try asking:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>&quot;What movies should I watch next?&quot;</li>
                  <li>&quot;Tell me about my anime taste&quot;</li>
                  <li>&quot;Who am I most compatible with?&quot;</li>
                  <li>&quot;Recommend me some books&quot;</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
              </div>
            ))}

            {isLoading && !errorMessage && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 bg-card">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || disabled || Boolean(errorMessage)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={
              isLoading || disabled || Boolean(errorMessage) || !input.trim()
            }
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
