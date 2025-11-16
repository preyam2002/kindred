"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  Play,
  ArrowLeft,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface QueueItemWithMedia {
  id: string;
  media_type: string;
  media_id: string;
  position: number;
  priority: "low" | "medium" | "high";
  notes?: string;
  media: any;
  vote_count?: number;
  has_voted?: boolean;
}

interface QueueData {
  queue: QueueItemWithMedia[];
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export default function FriendQueuePage() {
  const params = useParams();
  const username = params.username as string;
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, [username]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/queue/user/${username}`);
      if (res.ok) {
        const data = await res.json();
        setData(data);
      } else if (res.status === 403) {
        setError("You must be friends to view this queue");
      } else if (res.status === 404) {
        setError("User not found");
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

  const handleVote = async (queueItemId: string) => {
    try {
      const res = await fetch(`/api/queue/${queueItemId}/vote`, {
        method: "POST",
      });
      if (res.ok) {
        // Refresh queue to get updated vote counts
        fetchQueue();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to vote");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading queue..." fullScreen />;
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

  if (!data) {
    return null;
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
        {/* Back Button */}
        <Link
          href={`/u/${username}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {data.user.avatar ? (
                <img
                  src={data.user.avatar}
                  alt={data.user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                data.user.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {data.user.username}'s Queue
              </h1>
              <p className="text-muted-foreground">
                Help your friend decide what to watch next
              </p>
            </div>
          </div>
        </div>

        {/* Queue List */}
        {data.queue.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Queue is empty</h3>
            <p className="text-muted-foreground">
              {data.user.username} hasn't added anything to their queue yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.queue.map((item, index) => (
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
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      item.priority
                    )}`}
                  >
                    {item.priority}
                  </div>
                </div>

                {/* Vote Count & Button */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {(item.vote_count ?? 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">
                      <Users className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {item.vote_count}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`p-2 rounded-lg transition-all ${
                      item.has_voted
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="Vote for this item"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {data.queue.length > 0 && (
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-sm flex-wrap gap-4">
              <div>
                <span className="text-muted-foreground">Total items:</span>
                <span className="ml-2 font-semibold">{data.queue.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">High priority:</span>
                <span className="ml-2 font-semibold text-red-500">
                  {data.queue.filter((i) => i.priority === "high").length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total votes:</span>
                <span className="ml-2 font-semibold text-blue-500">
                  {data.queue.reduce((sum, i) => sum + (i.vote_count || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-500">
            <Star className="w-4 h-4 inline mr-1" />
            Vote for items you think {data.user.username} should watch or read
            next! Your votes help prioritize their queue.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
