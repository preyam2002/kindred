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
  Star,
  Flame,
  Target,
  Shuffle,
  Share2,
  Heart,
  Calendar,
  Zap,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { normalizePosterUrl } from "@/lib/utils";

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
      averageRatings: {
        overall: number | null;
        books: number | null;
        anime: number | null;
        manga: number | null;
        movies: number | null;
        music: number | null;
      };
      ratedCounts: {
        overall: number;
        books: number;
        anime: number;
        manga: number;
        movies: number;
        music: number;
      };
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

interface EnhancedDashboardData {
  streak: {
    current_streak: number;
    longest_streak: number;
    total_points: number;
    level: number;
  };
  daily_challenge: {
    ratings_today: number;
    goal: number;
    completed: boolean;
  };
  trending_in_network: Array<{
    media_id: string;
    friend_count: number;
  }>;
  recent_friend_activity: Array<any>;
  total_friends: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [enhancedData, setEnhancedData] = useState<EnhancedDashboardData | null>(null);
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

    async function fetchEnhancedDashboard() {
      try {
        const res = await fetch("/api/dashboard-enhanced");
        if (res.ok) {
          const data = await res.json();
          setEnhancedData(data);
        }
      } catch (error) {
        console.error("Error fetching enhanced dashboard:", error);
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
      fetchEnhancedDashboard();
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

  const ratingSummary = stats.media.averageRatings;
  const ratedCounts = stats.media.ratedCounts;
  const ratingCards = [
    { label: "Overall", value: ratingSummary.overall, count: ratedCounts.overall, type: "all" },
    { label: "Books", value: ratingSummary.books, count: ratedCounts.books, type: "book" },
    { label: "Anime", value: ratingSummary.anime, count: ratedCounts.anime, type: "anime" },
    { label: "Manga", value: ratingSummary.manga, count: ratedCounts.manga, type: "manga" },
    { label: "Movies", value: ratingSummary.movies, count: ratedCounts.movies, type: "movie" },
    { label: "Music", value: ratingSummary.music, count: ratedCounts.music, type: "music" },
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, @{session?.user?.username}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your kindred connections
          </p>
        </motion.div>

        {/* Streak & Daily Challenge */}
        {enhancedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid md:grid-cols-2 gap-4 mb-8"
          >
            {/* Streak Card */}
            <Link
              href="/challenges"
              className="border-2 border-primary/20 rounded-xl p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Flame className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Streak</div>
                    <div className="text-3xl font-bold">
                      {enhancedData.streak.current_streak} days
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Level</div>
                  <div className="text-2xl font-bold text-primary">{enhancedData.streak.level}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Best: {enhancedData.streak.longest_streak} days
                </span>
                <span className="text-primary font-medium group-hover:gap-2 inline-flex items-center gap-1 transition-all">
                  View Challenges
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Daily Challenge Card */}
            <div className="border-2 border-border rounded-xl p-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Daily Challenge</div>
                    <div className="text-3xl font-bold">
                      {enhancedData.daily_challenge.ratings_today}/{enhancedData.daily_challenge.goal}
                    </div>
                  </div>
                </div>
                {enhancedData.daily_challenge.completed && (
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (enhancedData.daily_challenge.ratings_today /
                        enhancedData.daily_challenge.goal) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {enhancedData.daily_challenge.completed
                  ? "Challenge complete! Come back tomorrow for more."
                  : `Rate ${enhancedData.daily_challenge.goal - enhancedData.daily_challenge.ratings_today} more items today`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Actions - Viral Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/taste-challenge"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-pink-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-semibold mb-1">Taste Challenge</h3>
              <p className="text-xs text-muted-foreground">Challenge your friends</p>
            </Link>

            <Link
              href="/roulette"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shuffle className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-1">Roulette</h3>
              <p className="text-xs text-muted-foreground">Spin for picks</p>
            </Link>

            <Link
              href="/share-cards"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Share2 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-1">Share Cards</h3>
              <p className="text-xs text-muted-foreground">Create & share</p>
            </Link>

            <Link
              href="/year-wrapped"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Year Wrapped</h3>
              <p className="text-xs text-muted-foreground">Your year recap</p>
            </Link>

            <Link
              href="/leaderboards"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold mb-1">Leaderboards</h3>
              <p className="text-xs text-muted-foreground">Compete & win</p>
            </Link>

            <Link
              href="/blind-match"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-1">Blind Match</h3>
              <p className="text-xs text-muted-foreground">Find taste twins</p>
            </Link>

            <Link
              href="/social-feed"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold mb-1">Social Feed</h3>
              <p className="text-xs text-muted-foreground">See what's hot</p>
            </Link>

            <Link
              href="/chat"
              className="paper-card p-6 hover:shadow-lg transition-all group text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="font-semibold mb-1">AI Chat</h3>
              <p className="text-xs text-muted-foreground">Get recommendations</p>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
              { label: "Books", count: stats.media.books, icon: BookOpen, type: "book" },
              { label: "Anime", count: stats.media.anime, icon: Tv, type: "anime" },
              { label: "Manga", count: stats.media.manga, icon: BookOpen, type: "manga" },
              { label: "Movies", count: stats.media.movies, icon: Film, type: "movie" },
              { label: "Music", count: stats.media.music, icon: Music, type: "music" },
            ].map(({ label, count, icon: Icon, type }) => (
              <Link
                key={label}
                href={`/library?type=${type}`}
                className="text-center border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-accent transition-colors cursor-pointer"
              >
                <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Rating Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border rounded-lg p-6 bg-card mb-12"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Average Ratings
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ratingCards.map(({ label, value, count, type }) => (
              <div
                key={label}
                className="border border-border rounded-lg p-4 bg-background/60 flex flex-col gap-2"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {label}
                </div>
                <div className="text-2xl font-bold">
                  {value !== null ? `${value.toFixed(1)}/10` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {count > 0
                    ? `${count} ${count === 1 ? "rating" : "ratings"}`
                    : type === "music"
                      ? "Ratings not available"
                      : "No ratings yet"}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Recent Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
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
          transition={{ delay: 0.45 }}
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
                      src={normalizePosterUrl(rec.media.poster_url) || ""}
                      alt={rec.media.title}
                      className="w-full aspect-[2/3] object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".fallback-placeholder")) {
                          const fallback = document.createElement("div");
                          fallback.className = "fallback-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center";
                          fallback.innerHTML = `<div class="text-4xl">${rec.media.type === "book" ? "📚" : rec.media.type === "movie" ? "🎬" : rec.media.type === "music" ? "🎵" : "📺"}</div>`;
                          parent.appendChild(fallback);
                        }
                      }}
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
          transition={{ delay: 0.5 }}
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
                      src={normalizePosterUrl(activity.media_items.poster_url) || ""}
                      alt={activity.media_items.title}
                      className="w-full aspect-[2/3] object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".fallback-placeholder")) {
                          const fallback = document.createElement("div");
                          fallback.className = "fallback-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center";
                          fallback.innerHTML = '<div class="text-4xl">📚</div>';
                          parent.appendChild(fallback);
                        }
                      }}
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

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
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

