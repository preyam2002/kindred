"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Palette,
  Star,
  TrendingUp,
  ArrowRight,
  Crown,
  Medal,
  Award,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  label: string;
  extra?: string;
}

interface LeaderboardData {
  category: string;
  period: string;
  leaderboard: LeaderboardEntry[];
  user_rank: number | null;
}

const CATEGORIES = [
  {
    id: "top_raters",
    name: "Top Raters",
    icon: Trophy,
    description: "Most active reviewers",
  },
  {
    id: "streak_champions",
    name: "Streak Champions",
    icon: Flame,
    description: "Longest active streaks",
  },
  {
    id: "diversity",
    name: "Taste Diversity",
    icon: Palette,
    description: "Most varied taste",
  },
  {
    id: "points",
    name: "Points Leaders",
    icon: Star,
    description: "Total points earned",
  },
  {
    id: "genre_experts",
    name: "Genre Experts",
    icon: TrendingUp,
    description: "Top rated in genres",
  },
];

const PERIODS = [
  { id: "all_time", name: "All Time" },
  { id: "monthly", name: "This Month" },
  { id: "weekly", name: "This Week" },
];

export default function LeaderboardsPage() {
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState("top_raters");
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      loadLeaderboard();
    }
  }, [status, selectedCategory, selectedPeriod]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboards?category=${selectedCategory}&period=${selectedPeriod}`
      );
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Leaderboards
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Compete with users worldwide and climb the ranks
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {CATEGORIES.slice(0, 3).map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="paper-card p-6">
                  <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
              );
            })}
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Compete
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
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Trophy className="w-4 h-4" />
          Compete & Win
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Leaderboards</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how you stack up against the community
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Category Selector */}
        <div className="lg:col-span-1">
          <div className="paper-card p-6 sticky top-6">
            <h3 className="font-semibold mb-4">Categories</h3>

            <div className="space-y-2 mb-6">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full p-3 rounded-lg transition-all text-left ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-semibold text-sm">{cat.name}</div>
                        <div className="text-xs opacity-80">
                          {cat.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-3 text-sm">Time Period</h4>
              <div className="space-y-1">
                {PERIODS.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`w-full px-3 py-2 rounded text-sm transition-colors text-left ${
                      selectedPeriod === period.id
                        ? "bg-primary/20 font-semibold"
                        : "hover:bg-accent"
                    }`}
                  >
                    {period.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-3">
          <motion.div
            key={`${selectedCategory}-${selectedPeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="paper-card overflow-hidden"
          >
            {loading ? (
              <div className="p-20 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
                <div className="text-muted-foreground">Loading rankings...</div>
              </div>
            ) : !data || data.leaderboard.length === 0 ? (
              <div className="p-20 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No rankings available yet for this category
                </p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {data.leaderboard.length >= 3 && (
                  <div className="bg-gradient-to-b from-primary/10 to-transparent p-8 border-b border-border">
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {/* 2nd Place */}
                      <div className="text-center pt-12">
                        <Medal className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                        <div className="font-bold text-lg">
                          {data.leaderboard[1].username}
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {data.leaderboard[1].score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.leaderboard[1].label}
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="text-center">
                        <Crown className="w-16 h-16 mx-auto mb-2 text-yellow-500" />
                        <div className="font-bold text-xl">
                          {data.leaderboard[0].username}
                        </div>
                        <div className="text-4xl font-bold text-primary">
                          {data.leaderboard[0].score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.leaderboard[0].label}
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="text-center pt-16">
                        <Award className="w-10 h-10 mx-auto mb-2 text-amber-600" />
                        <div className="font-bold">
                          {data.leaderboard[2].username}
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {data.leaderboard[2].score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.leaderboard[2].label}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rest of Rankings */}
                <div className="divide-y divide-border">
                  {data.leaderboard.slice(3).map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors ${
                        entry.user_id === session.user?.id
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      <div className="w-12 text-center font-bold text-lg text-muted-foreground">
                        #{entry.rank}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold">{entry.username}</div>
                        {entry.extra && (
                          <div className="text-xs text-muted-foreground">
                            {entry.extra}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {entry.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current User Rank (if not in top 100) */}
                {data.user_rank && data.user_rank > 100 && (
                  <div className="p-4 bg-primary/10 border-t-2 border-primary">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Your Rank</div>
                      <div className="text-2xl font-bold text-primary">
                        #{data.user_rank}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
