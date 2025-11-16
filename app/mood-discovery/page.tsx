"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Star,
  Heart,
  Zap,
  Cloud,
  Sun,
  Moon,
  Coffee,
  TrendingUp,
  BookOpen,
  Film,
  Music,
  Tv,
} from "lucide-react";
import { normalizePosterUrl } from "@/lib/utils";

interface Mood {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
}

interface MoodRecommendation {
  media: {
    id: string;
    title: string;
    type: string;
    poster_url?: string;
    genre?: string[];
    author?: string;
    artist?: string;
  };
  reason: string;
  moodMatch: number;
}

export default function MoodDiscoveryPage() {
  const { data: session, status } = useSession();
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<MoodRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    fetchMoods();
  }, [status]);

  async function fetchMoods() {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/mood-discovery/moods");
      if (res.ok) {
        const data = await res.json();
        setMoods(data.moods || []);
      }
    } catch (error) {
      console.error("Error fetching moods:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecommendations() {
    if (selectedMoods.length === 0) return;

    setLoadingRecs(true);
    try {
      const params = new URLSearchParams();
      selectedMoods.forEach((mood) => params.append("moods", mood));
      params.append("limit", "24");

      const res = await fetch(`/api/mood-discovery/recommendations?${params.toString()}`);
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

  useEffect(() => {
    if (selectedMoods.length > 0) {
      fetchRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [selectedMoods]);

  const toggleMood = (moodName: string) => {
    setSelectedMoods((prev) =>
      prev.includes(moodName)
        ? prev.filter((m) => m !== moodName)
        : [...prev, moodName]
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Loading moods...</div>
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

  const moodsByCategory = moods.reduce((acc, mood) => {
    if (!acc[mood.category]) {
      acc[mood.category] = [];
    }
    acc[mood.category].push(mood);
    return acc;
  }, {} as Record<string, Mood[]>);

  const getMediaIcon = (type: string) => {
    const icons: Record<string, any> = {
      book: BookOpen,
      anime: Tv,
      manga: BookOpen,
      movie: Film,
      music: Music,
    };
    return icons[type] || Sparkles;
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Heart className="w-4 h-4" />
          Mood-Based Discovery
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          How Are You Feeling?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select your current mood and we'll recommend media that matches perfectly.
          Whether you're happy, sad, energetic, or relaxed - we've got you covered.
        </p>
      </motion.div>

      {/* Mood Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold mb-6">Select Your Mood(s)</h2>

        {Object.entries(moodsByCategory).map(([category, categoryMoods]) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 capitalize text-muted-foreground">
              {category.replace(/_/g, " ")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categoryMoods.map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => toggleMood(mood.name)}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    selectedMoods.includes(mood.name)
                      ? "border-primary bg-primary/10 shadow-lg scale-105"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="text-4xl mb-2">{mood.emoji}</div>
                  <div className="font-medium text-sm capitalize">
                    {mood.name.replace(/-/g, " ")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {mood.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Selected Moods Summary */}
      {selectedMoods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 border border-primary/20 rounded-xl bg-primary/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-medium">
                Finding media for: {selectedMoods.map(m => m.replace(/-/g, " ")).join(", ")}
              </span>
            </div>
            <button
              onClick={() => setSelectedMoods([])}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {selectedMoods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recommended for Your Mood</h2>
            <button
              onClick={fetchRecommendations}
              disabled={loadingRecs}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRecs ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loadingRecs ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-muted-foreground">Finding perfect matches...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-16 border border-border rounded-xl">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-bold mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground mb-6">
                We're still building mood associations. Try different moods or add more items to your library!
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Go to Library
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {recommendations.map((rec, index) => {
                const Icon = getMediaIcon(rec.media.type);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Link
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        rec.media.title
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        {/* Poster */}
                        {rec.media.poster_url ? (
                          <div className="relative aspect-[2/3] bg-muted">
                            <img
                              src={normalizePosterUrl(rec.media.poster_url) || ""}
                              alt={rec.media.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                            {/* Mood Match Badge */}
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-bold flex items-center gap-1">
                              <Heart className="w-3 h-3 text-pink-500 fill-current" />
                              {rec.moodMatch}%
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[2/3] bg-muted flex items-center justify-center">
                            <Icon className="w-12 h-12 text-muted-foreground opacity-50" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="p-3">
                          <div className="flex items-center gap-1 mb-1">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground capitalize">
                              {rec.media.type}
                            </span>
                          </div>

                          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {rec.media.title}
                          </h3>

                          {(rec.media.author || rec.media.artist) && (
                            <p className="text-xs text-muted-foreground mb-2 truncate">
                              {rec.media.author || rec.media.artist}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {rec.reason}
                          </p>

                          {rec.media.genre && rec.media.genre.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rec.media.genre.slice(0, 2).map((genre: string) => (
                                <span
                                  key={genre}
                                  className="px-2 py-0.5 bg-muted rounded text-[10px]"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {selectedMoods.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 border border-border rounded-xl"
        >
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold mb-2">Select a mood to get started</h3>
          <p className="text-muted-foreground">
            Choose one or more moods above to get personalized recommendations
          </p>
        </motion.div>
      )}
    </div>
  );
}
