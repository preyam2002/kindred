"use client";

import { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import {
  Shuffle,
  Sparkles,
  ArrowUpDown,
  Trash2,
  Star,
  Plus,
  Play,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { QueueItem } from "@/types/database";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface QueueItemWithMedia extends QueueItem {
  media: any;
}

type SortMode = "manual" | "priority" | "random" | "ai";

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItemWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("manual");

  useEffect(() => {
    fetchQueue();
  }, [sortMode]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/queue?sort=${sortMode}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
      } else {
        setError("Failed to load queue");
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
      setError("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this item from your queue?")) return;

    try {
      const res = await fetch(`/api/queue/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQueue((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handlePriorityChange = async (
    id: string,
    priority: "low" | "medium" | "high"
  ) => {
    try {
      const res = await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        fetchQueue();
      }
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your queue..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load queue"
        message={error}
        onRetry={fetchQueue}
      />
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-500/10";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10";
      case "low":
        return "text-blue-500 bg-blue-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Recommendation Queue</h1>
          <p className="text-muted-foreground">
            Your personalized watch/read list with smart sorting
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortMode("manual")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortMode === "manual"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 inline mr-1" />
                Manual
              </button>
              <button
                onClick={() => setSortMode("priority")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortMode === "priority"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Star className="w-4 h-4 inline mr-1" />
                Priority
              </button>
              <button
                onClick={() => setSortMode("ai")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortMode === "ai"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                AI Recommended
              </button>
            </div>
          </div>

          <button
            onClick={handleShuffle}
            className="ml-auto px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
          >
            <Shuffle className="w-4 h-4 inline mr-1" />
            Shuffle
          </button>
        </div>

        {/* Queue List */}
        {queue.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Your queue is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add items from your library or recommendations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all"
              >
                {/* Position Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                </div>

                {/* Poster */}
                <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-muted">
                  {item.media?.poster_url ? (
                    <img
                      src={item.media.poster_url}
                      alt={item.media.title || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 line-clamp-1">
                    {item.media?.title || "Untitled"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{item.media_type}</span>
                    {item.notes && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{item.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Priority Badge */}
                <div className="flex-shrink-0">
                  <select
                    value={item.priority}
                    onChange={(e) =>
                      handlePriorityChange(
                        item.id,
                        e.target.value as "low" | "medium" | "high"
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${getPriorityColor(
                      item.priority
                    )}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                    aria-label="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {queue.length > 0 && (
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Total items:</span>
                <span className="ml-2 font-semibold">{queue.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">High priority:</span>
                <span className="ml-2 font-semibold text-red-500">
                  {queue.filter((i) => i.priority === "high").length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Sort mode:</span>
                <span className="ml-2 font-semibold capitalize">{sortMode}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
