"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Film,
  Music,
  Tv,
  Sparkles,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
  Settings,
  ExternalLink,
  Search,
} from "lucide-react";
import Image from "next/image";

interface Recommendation {
  media: {
    id: string;
    title: string;
    type: string;
    poster_url?: string;
    genre?: string[];
  };
  reason: string;
  score: number;
  source: string;
}

interface DashboardData {
  stats: {
    media: {
      total: number;
      books: number;
      anime: number;
      manga: number;
      movies: number;
      music: number;
    };
    integrations: number;
    totalMatches: number;
  };
  recentMatches: Array<{
    id: string;
    similarity_score: number;
    shared_count: number;
    otherUser: {
      id: string;
      username: string;
      avatar?: string;
    };
  }>;
  suggestedMatches: Array<{
    user: {
      id: string;
      username: string;
      avatar?: string;
    };
    score: number;
    sharedCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    timestamp: string;
    media_items: {
      id: string;
      title: string;
      type: string;
      poster_url?: string;
    };
  }>;
  connectedIntegrations: string[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/recommendations?limit=12");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecs(false);
      }
    }

    if (status === "authenticated") {
      fetchDashboard();
      fetchRecommendations();
    } else if (status === "unauthenticated") {
      setLoading(false);
      setLoadingRecs(false);
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Unable to load dashboard</div>
      </div>
    );
  }

  const { stats, recentMatches, suggestedMatches, recentActivity, connectedIntegrations } =
    dashboardData;

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, @{session?.user?.username}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your kindred connections
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats.media.total}
            </div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats.integrations}
            </div>
            <div className="text-sm text-muted-foreground">Integrations</div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats.totalMatches}
            </div>
            <div className="text-sm text-muted-foreground">Matches</div>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats.media.books + stats.media.anime + stats.media.manga}
            </div>
            <div className="text-sm text-muted-foreground">Books & Media</div>
          </div>
        </motion.div>

        {/* Media Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-border rounded-lg p-6 bg-card mb-12"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Your Library
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Books", count: stats.media.books, icon: BookOpen },
              { label: "Anime", count: stats.media.anime, icon: Tv },
              { label: "Manga", count: stats.media.manga, icon: BookOpen },
              { label: "Movies", count: stats.media.movies, icon: Film },
              { label: "Music", count: stats.media.music, icon: Music },
            ].map(({ label, count, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Recent Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-border rounded-lg p-6 bg-card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recent Matches
            </h2>
            {recentMatches.length > 0 ? (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/${session?.user?.username}/${match.otherUser.username}`}
                    className="block border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {match.otherUser.avatar ? (
                          <img
                            src={match.otherUser.avatar}
                            alt={match.otherUser.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {match.otherUser.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            @{match.otherUser.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.shared_count} shared items
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {match.similarity_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          MashScore
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No matches yet</p>
                <p className="text-sm mt-2 mb-4">
                  Connect integrations to find your kindred spirits
                </p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
                >
                  <Search className="w-4 h-4" />
                  Discover Users
                </Link>
              </div>
            )}
          </motion.div>

          {/* Suggested Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-border rounded-lg p-6 bg-card"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Suggested Matches
            </h2>
            {suggestedMatches.length > 0 ? (
              <div className="space-y-4">
                {suggestedMatches.map((suggestion) => (
                  <Link
                    key={suggestion.user.id}
                    href={`/${session?.user?.username}/${suggestion.user.username}`}
                    className="block border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {suggestion.user.avatar ? (
                          <img
                            src={suggestion.user.avatar}
                            alt={suggestion.user.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {suggestion.user.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            @{suggestion.user.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.sharedCount} shared items
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {suggestion.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          MashScore
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions yet</p>
                <p className="text-sm mt-2 mb-4">
                  More suggestions will appear as users join
                </p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  Browse All Users
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-border rounded-lg p-6 bg-card mb-12"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommendations for You
          </h2>
          {loadingRecs ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading recommendations...
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 12).map((rec) => (
                <Link
                  key={rec.media.id}
                  href={`https://www.google.com/search?q=${encodeURIComponent(rec.media.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-border rounded-lg overflow-hidden bg-background hover:border-primary/50 transition-colors"
                >
                  {rec.media.poster_url ? (
                    <img
                      src={rec.media.poster_url}
                      alt={rec.media.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      {rec.media.type === "book" ? "📚" : rec.media.type === "movie" ? "🎬" : rec.media.type === "music" ? "🎵" : "📺"}
                    </div>
                  )}
                  <div className="p-2">
                    <h3 className="font-medium text-xs truncate mb-1 group-hover:text-primary transition-colors">
                      {rec.media.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rec.reason}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recommendations yet</p>
              <p className="text-sm mt-2">
                Connect more integrations to get personalized recommendations
              </p>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="border border-border rounded-lg p-6 bg-card mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </h2>
            <Link
              href={`/u/${session?.user?.username}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="border border-border rounded-lg overflow-hidden bg-background"
                >
                  {activity.media_items?.poster_url ? (
                    <img
                      src={activity.media_items.poster_url}
                      alt={activity.media_items.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      📚
                    </div>
                  )}
                  <div className="p-2">
                    <h3 className="font-medium text-xs truncate">
                      {activity.media_items?.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm mt-2">
                Connect integrations to start tracking your media
              </p>
              <Link
                href="/settings"
                className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                Connect Integrations
              </Link>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-4"
        >
          <Link
            href="/settings"
            className="flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Integrations
          </Link>
          <Link
            href={`/u/${session?.user?.username}`}
            className="flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
          >
            View Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
    </div>
  );
}

