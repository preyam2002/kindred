"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Star,
  MessageCircle,
  Grid3x3,
  UserPlus,
  Trophy,
  Heart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface ActivityContent {
  media_id?: string;
  media_title?: string;
  rating?: number;
  collection_id?: string;
  collection_title?: string;
  friend_username?: string;
  achievement_name?: string;
}

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: "rating" | "review" | "collection" | "friend" | "achievement";
  content: ActivityContent;
  is_public: boolean;
  created_at: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "friends" | "own">("all");

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/activity?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      } else {
        setError("Failed to load activity");
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      setError("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "rating":
        return <Star className="w-5 h-5 text-yellow-500" />;
      case "review":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "collection":
        return <Grid3x3 className="w-5 h-5 text-purple-500" />;
      case "friend":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "achievement":
        return <Trophy className="w-5 h-5 text-orange-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const { activity_type, content } = activity;

    switch (activity_type) {
      case "rating":
        return (
          <>
            rated{" "}
            <Link href={`/media/${content.media_id}`} className="font-semibold hover:text-primary">
              {content.media_title}
            </Link>{" "}
            <span className="text-yellow-500">{content.rating}/10</span>
          </>
        );
      case "review":
        return (
          <>
            reviewed{" "}
            <Link href={`/media/${content.media_id}`} className="font-semibold hover:text-primary">
              {content.media_title}
            </Link>
          </>
        );
      case "collection":
        return (
          <>
            created a new collection{" "}
            <Link href={`/collections/${content.collection_id}`} className="font-semibold hover:text-primary">
              {content.collection_title}
            </Link>
          </>
        );
      case "friend":
        return (
          <>
            became friends with{" "}
            <Link href={`/u/${content.friend_username}`} className="font-semibold hover:text-primary">
              {content.friend_username}
            </Link>
          </>
        );
      case "achievement":
        return (
          <>
            unlocked achievement:{" "}
            <span className="font-semibold">{content.achievement_name}</span>
          </>
        );
      default:
        return "performed an action";
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading activity..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load activity"
        message={error}
        onRetry={fetchActivities}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Activity Feed</h1>
          <p className="text-muted-foreground">
            See what you and your friends have been up to
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-3 border-b-2 transition-colors ${
              filter === "all"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            All Activity
          </button>
          <button
            onClick={() => setFilter("friends")}
            className={`px-4 py-3 border-b-2 transition-colors ${
              filter === "friends"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Friends Only
          </button>
          <button
            onClick={() => setFilter("own")}
            className={`px-4 py-3 border-b-2 transition-colors ${
              filter === "own"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            My Activity
          </button>
        </div>

        {/* Activity Feed */}
        {activities.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-muted-foreground">
              {filter === "friends"
                ? "Your friends haven't been active recently"
                : "Start rating, reviewing, and creating collections!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all"
              >
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <Link href={`/u/${activity.user.username}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform">
                      {activity.user.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        activity.user.username?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                  </Link>
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <Link
                          href={`/u/${activity.user.username}`}
                          className="font-semibold hover:text-primary"
                        >
                          {activity.user.username}
                        </Link>{" "}
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
