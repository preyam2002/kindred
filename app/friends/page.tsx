"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Check,
  X,
  Clock,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface PendingRequest {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  user: User;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "pending">("friends");

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setPendingReceived(data.pendingReceived || []);
        setPendingSent(data.pendingSent || []);
      } else {
        setError("Failed to load friends");
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      setError("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`/api/friends/${id}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this friend?")) return;

    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading friends..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load friends"
        message={error}
        onRetry={fetchFriends}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">
            Connect with your taste twins and share recommendations
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === "friends"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === "pending"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Requests ({pendingReceived.length + pendingSent.length})
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-6">
                  Find users with similar tastes and send friend requests
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        friend.username?.[0]?.toUpperCase() || "?"
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/u/${friend.username}`}
                        className="font-semibold hover:text-primary line-clamp-1"
                      >
                        {friend.username || friend.email}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        @{friend.username}
                      </p>
                    </div>

                    {/* Remove button (shown on hover) */}
                    <button
                      onClick={() => handleRemove(friend.id)}
                      className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-lg text-destructive transition-all"
                      aria-label="Remove friend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Tab */}
        {activeTab === "pending" && (
          <div className="space-y-6">
            {/* Received Requests */}
            {pendingReceived.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Received Requests ({pendingReceived.length})
                </h3>
                <div className="space-y-3">
                  {pendingReceived.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {request.user?.avatar ? (
                          <img
                            src={request.user.avatar}
                            alt={request.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          request.user?.username?.[0]?.toUpperCase() || "?"
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/u/${request.user?.username}`}
                          className="font-semibold hover:text-primary line-clamp-1"
                        >
                          {request.user?.username || request.user?.email}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                          aria-label="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                          aria-label="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {pendingSent.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Sent Requests ({pendingSent.length})
                </h3>
                <div className="space-y-3">
                  {pendingSent.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {request.user?.avatar ? (
                          <img
                            src={request.user.avatar}
                            alt={request.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          request.user?.username?.[0]?.toUpperCase() || "?"
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold line-clamp-1">
                          {request.user?.username || request.user?.email}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Send className="w-3 h-3" />
                          Pending
                        </div>
                      </div>

                      {/* Cancel Button */}
                      <button
                        onClick={() => handleReject(request.id)}
                        className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                        aria-label="Cancel request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {pendingReceived.length === 0 && pendingSent.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">
                  Friend requests will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
