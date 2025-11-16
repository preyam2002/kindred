"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Heart,
  Zap,
  Target,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Users,
  ArrowRight,
} from "lucide-react";

interface TasteProfile {
  // Genre preferences across all media
  topGenres: {
    anime?: string[];
    manga?: string[];
    book?: string[];
    movie?: string[];
    music?: string[];
  };

  // Rating statistics
  avgRating: number;
  ratingDistribution: Record<string, number>;

  // Consumption patterns
  totalItemsCount: number;
  mediaTypeDistribution: Record<string, number>;

  // Temporal data
  itemsAddedLast30Days: number;
  avgRatingTrend: Array<{ month: string; avg: number }>;

  // Taste characteristics (0-10 scores)
  genreDiversityScore: number;
  ratingGenerosityScore: number;
  activityScore: number;

  // Additional computed metrics
  mostActiveMediaType: string;
  favoriteGenresOverall: string[];
  ratingPattern: string; // "harsh", "generous", "balanced"
  consumptionStyle: string; // "binge_watcher", "steady_reader", "diverse_explorer"
}

export default function TasteDNAPage() {
  const { data: session, status } = useSession();
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasteProfile() {
      try {
        const res = await fetch("/api/taste-dna");
        if (res.ok) {
          const data = await res.json();
          setTasteProfile(data);
        }
      } catch (error) {
        console.error("Error fetching taste profile:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchTasteProfile();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Analyzing your taste DNA...</div>
        </div>
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

  if (!tasteProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Build Your Taste DNA</h1>
          <p className="text-muted-foreground mb-6">
            Connect your accounts and rate some media to unlock your personalized Taste DNA Profile
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Connect Integrations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const {
    topGenres,
    avgRating,
    ratingDistribution,
    totalItemsCount,
    mediaTypeDistribution,
    itemsAddedLast30Days,
    genreDiversityScore,
    ratingGenerosityScore,
    activityScore,
    mostActiveMediaType,
    favoriteGenresOverall,
    ratingPattern,
    consumptionStyle,
  } = tasteProfile;

  // Calculate rating distribution percentages
  const totalRatings = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  const ratingPercentages = Object.entries(ratingDistribution).map(([range, count]) => ({
    range,
    count,
    percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
  }));

  // Get taste characteristics descriptions
  const getDiversityDescription = (score: number) => {
    if (score >= 8) return "Genre Omnivore - You explore everything!";
    if (score >= 6) return "Diverse Explorer - You enjoy variety";
    if (score >= 4) return "Selective Dabbler - You have clear preferences";
    return "Genre Specialist - You know what you like";
  };

  const getGenerosityDescription = (score: number) => {
    if (score >= 8) return "Generous Critic - You see the best in everything";
    if (score >= 6) return "Balanced Reviewer - Fair and measured";
    if (score >= 4) return "Discerning Critic - You have high standards";
    return "Harsh Critic - Only the best earn your praise";
  };

  const getActivityDescription = (score: number) => {
    if (score >= 8) return "Power User - Always consuming new media";
    if (score >= 6) return "Active Member - Regularly engaged";
    if (score >= 4) return "Casual User - Steady but relaxed";
    return "Selective User - Quality over quantity";
  };

  // Get consumption style details
  const getConsumptionStyleEmoji = (style: string) => {
    const map: Record<string, string> = {
      binge_watcher: "🍿",
      steady_reader: "📚",
      diverse_explorer: "🌍",
      casual_enjoyer: "☕",
      completionist: "✅",
    };
    return map[style] || "🎯";
  };

  const getConsumptionStyleDescription = (style: string) => {
    const map: Record<string, string> = {
      binge_watcher: "You dive deep into series and consume content in bursts",
      steady_reader: "You maintain a consistent, measured consumption pace",
      diverse_explorer: "You constantly switch between different types of media",
      casual_enjoyer: "You enjoy media at a relaxed, comfortable pace",
      completionist: "You finish what you start and track everything meticulously",
    };
    return map[style] || "Unique consumption pattern";
  };

  // Media type icons
  const getMediaTypeIcon = (type: string) => {
    const map: Record<string, string> = {
      anime: "📺",
      manga: "📖",
      book: "📚",
      movie: "🎬",
      music: "🎵",
    };
    return map[type] || "🎯";
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Your Unique Taste Profile
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Your Taste DNA
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A deep analysis of your preferences across all media types, revealing what makes your taste unique
        </p>
      </motion.div>

      {/* Taste Characteristics - Hero Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-6 mb-12"
      >
        {/* Genre Diversity */}
        <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Genre Diversity</div>
              <div className="text-2xl font-bold">{genreDiversityScore.toFixed(1)}/10</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {getDiversityDescription(genreDiversityScore)}
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${genreDiversityScore * 10}%` }}
            />
          </div>
        </div>

        {/* Rating Generosity */}
        <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Heart className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Rating Style</div>
              <div className="text-2xl font-bold">{ratingGenerosityScore.toFixed(1)}/10</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {getGenerosityDescription(ratingGenerosityScore)}
          </p>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
              style={{ width: `${ratingGenerosityScore * 10}%` }}
            />
          </div>
        </div>

        {/* Activity Score */}
        <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Activity Level</div>
              <div className="text-2xl font-bold">{activityScore.toFixed(1)}/10</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {getActivityDescription(activityScore)}
          </p>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${activityScore * 10}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Consumption Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-6 mb-12"
      >
        {/* Consumption Style */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Your Consumption Style
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{getConsumptionStyleEmoji(consumptionStyle)}</div>
            <div>
              <div className="text-lg font-bold capitalize">
                {consumptionStyle.replace(/_/g, " ")}
              </div>
              <p className="text-sm text-muted-foreground">
                {getConsumptionStyleDescription(consumptionStyle)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <div className="text-2xl font-bold text-primary">{totalItemsCount}</div>
              <div className="text-xs text-muted-foreground">Total Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{itemsAddedLast30Days}</div>
              <div className="text-xs text-muted-foreground">Added This Month</div>
            </div>
          </div>
        </div>

        {/* Rating Overview */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Rating Overview
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">⭐</div>
            <div>
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}/10</div>
              <p className="text-sm text-muted-foreground capitalize">
                {ratingPattern.replace(/_/g, " ")} Critic
              </p>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-border">
            {ratingPercentages.slice(0, 5).map(({ range, percentage }) => (
              <div key={range} className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-12">{range}</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground w-12 text-right">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Media Type Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border border-border rounded-xl p-6 bg-card mb-12"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Your Media Mix
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(mediaTypeDistribution)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const percentage = totalItemsCount > 0 ? (count / totalItemsCount) * 100 : 0;
              return (
                <div
                  key={type}
                  className={`border border-border rounded-lg p-4 ${
                    type === mostActiveMediaType ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="text-4xl mb-2">{getMediaTypeIcon(type)}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize mb-2">{type}</div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {type === mostActiveMediaType && (
                    <div className="text-xs text-primary font-medium mt-2">Most Active</div>
                  )}
                </div>
              );
            })}
        </div>
      </motion.div>

      {/* Top Genres by Media Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border border-border rounded-xl p-6 bg-card mb-12"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Your Favorite Genres
        </h2>

        {/* Overall Favorites */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Overall Top Genres</div>
          <div className="flex flex-wrap gap-2">
            {favoriteGenresOverall.slice(0, 10).map((genre) => (
              <div
                key={genre}
                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
              >
                {genre}
              </div>
            ))}
          </div>
        </div>

        {/* By Media Type */}
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(topGenres).map(([mediaType, genres]) =>
            genres && genres.length > 0 ? (
              <div key={mediaType} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">{getMediaTypeIcon(mediaType)}</div>
                  <div className="text-sm font-bold capitalize">{mediaType}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 5).map((genre) => (
                    <div
                      key={genre}
                      className="px-2 py-1 bg-muted text-foreground rounded text-xs"
                    >
                      {genre}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border border-border rounded-xl p-8 bg-gradient-to-br from-primary/5 to-primary/10 text-center"
      >
        <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Find Your Taste Twins</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Use your unique Taste DNA to discover people with similar tastes across all media types
        </p>
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Discover Matches
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
