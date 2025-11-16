"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Star,
  Clock,
  ArrowRight,
  Flame,
  Activity,
  RefreshCw,
  Filter,
  X,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  user_id: string;
  username: string;
  action: string;
  media_id: string;
  media_type: string;
  media_title: string;
  media_cover?: string;
  rating: number;
  timestamp: string;
}

interface TrendingItem {
  media_id: string;
  media_type: string;
  title: string;
  cover?: string;
  genre?: string[];
  friend_count: number;
  avg_rating: number;
  author?: string;
  artist?: string;
  year?: number;
}

export default function SocialFeedPage() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    mediaType: "all" as "all" | "anime" | "manga" | "book" | "movie" | "music",
    minRating: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activityRes, trendingRes] = await Promise.all([
        fetch("/api/social-proof/activity"),
        fetch("/api/social-proof/trending"),
      ]);

      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivities(data.activities || []);
      }

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrending(data.trending || []);
      }
    } catch (error) {
      console.error("Error loading social feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtered data
  const filteredTrending = trending.filter((item) => {
    if (filters.mediaType !== "all" && item.media_type !== filters.mediaType) {
      return false;
    }
    if (filters.minRating > 0 && item.avg_rating < filters.minRating) {
      return false;
    }
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredActivities = activities.filter((activity) => {
    if (filters.mediaType !== "all" && activity.media_type !== filters.mediaType) {
      return false;
    }
    if (filters.minRating > 0 && activity.rating < filters.minRating) {
      return false;
    }
    if (searchQuery && !activity.media_title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Loading feed...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Social Feed
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            See what your taste twins are loving right now
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="paper-card p-6">
              <Activity className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Real-Time Activity</h3>
              <p className="text-sm text-muted-foreground">
                See what your friends just rated
              </p>
            </div>
            <div className="paper-card p-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Trending in Network</h3>
              <p className="text-sm text-muted-foreground">
                What's hot among your matches
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to See Feed
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          Your Network
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Social Feed</h1>
            <p className="text-lg text-muted-foreground">
              Discover what your taste twins are loving
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 border-2 rounded-lg transition-colors ${
                showFilters
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent"
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 border-2 border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              title="Refresh Feed"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="paper-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>
                <button
                  onClick={() => {
                    setFilters({ mediaType: "all", minRating: 0 });
                    setSearchQuery("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Media Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Media Type</label>
                  <select
                    value={filters.mediaType}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        mediaType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="anime">Anime</option>
                    <option value="manga">Manga</option>
                    <option value="book">Books</option>
                    <option value="movie">Movies</option>
                    <option value="music">Music</option>
                  </select>
                </div>

                {/* Min Rating Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Minimum Rating: {filters.minRating > 0 ? filters.minRating : "Any"}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={filters.minRating}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minRating: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* Search Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search titles..."
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredTrending.length} trending items and {filteredActivities.length} activities
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Trending Section */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Flame className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold">Trending in Your Network</h2>
            </div>

            {filteredTrending.length === 0 ? (
              <div className="paper-card p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {trending.length === 0
                    ? "No trending items yet. Connect with more users to see what's hot!"
                    : "No items match your filters. Try adjusting your search criteria."}
                </p>
                {trending.length === 0 && (
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Discover Users
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {filteredTrending.map((item) => (
                  <Link
                    key={item.media_id}
                    href={`/media/${item.media_type}/${item.media_id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="paper-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
                    >
                    {item.cover && (
                      <div className="aspect-[2/3] relative bg-muted">
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 px-3 py-1 bg-background/90 backdrop-blur rounded-full text-xs font-bold">
                          {item.friend_count} friend{item.friend_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="text-xs text-muted-foreground mb-1 uppercase">
                        {item.media_type}
                      </div>
                      <h3 className="font-bold mb-2 line-clamp-2">
                        {item.title}
                      </h3>

                      {item.author && (
                        <p className="text-sm text-muted-foreground mb-2">
                          by {item.author}
                        </p>
                      )}
                      {item.artist && (
                        <p className="text-sm text-muted-foreground mb-2">
                          by {item.artist}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{item.avg_rating}</span>
                        <span className="text-muted-foreground">avg rating</span>
                      </div>
                    </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed Sidebar */}
        <div>
          <div className="sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Recent Activity</h2>
            </div>

            <div className="paper-card divide-y divide-border max-h-[800px] overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {activities.length === 0
                      ? "No recent activity from your network"
                      : "No activities match your filters"}
                  </p>
                  {activities.length === 0 && (
                    <Link
                      href="/discover"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Find friends
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {activity.media_cover && (
                        <div className="w-12 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                          <img
                            src={activity.media_cover}
                            alt={activity.media_title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-1">
                          <span className="font-semibold">
                            {activity.username}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {activity.action}
                          </span>
                        </p>

                        <p className="font-medium text-sm mb-1 line-clamp-1">
                          {activity.media_title}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{activity.rating}/10</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(activity.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
