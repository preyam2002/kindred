"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Film,
  Music,
  Tv,
  ArrowRight,
  Star,
  ExternalLink,
} from "lucide-react";
import { normalizePosterUrl } from "@/lib/utils";

interface CrossMediaRecommendation {
  recommended_item: {
    id: string;
    title: string;
    type: string;
    poster_url?: string;
    genre?: string[];
    author?: string;
    artist?: string;
  };
  reason: string;
  score: number;
  based_on: {
    title: string;
    type: string;
  };
  cross_media: boolean;
}

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<CrossMediaRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchRecommendations();
  }, [status, filter]);

  async function fetchRecommendations() {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("type", filter);
      }
      params.append("cross_media", "true");
      params.append("limit", "24");

      const res = await fetch(`/api/recommendations/universal?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Generating cross-media recommendations...</div>
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

  const getMediaColor = (type: string) => {
    const colors: Record<string, string> = {
      book: "text-blue-500",
      anime: "text-purple-500",
      manga: "text-pink-500",
      movie: "text-red-500",
      music: "text-green-500",
    };
    return colors[type] || "text-primary";
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Cross-Media Discovery
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Universal Recommendations
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Discover amazing content across all media types based on your unique taste.
          Love an anime? We'll find you the perfect book. Obsessed with a film? Check out these songs.
        </p>
      </motion.div>

      {/* Filters & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-8"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Types" },
            { value: "book", label: "Books" },
            { value: "anime", label: "Anime" },
            { value: "manga", label: "Manga" },
            { value: "movie", label: "Movies" },
            { value: "music", label: "Music" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === item.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-accent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchRecommendations()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Recommendations Yet</h2>
          <p className="text-muted-foreground mb-6">
            Add more items to your library and rate them to get personalized cross-media recommendations
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Go to Library
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
          {recommendations.map((rec, index) => {
            const Icon = getMediaIcon(rec.recommended_item.type);
            const colorClass = getMediaColor(rec.recommended_item.type);

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
                    rec.recommended_item.title
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    {/* Poster */}
                    {rec.recommended_item.poster_url ? (
                      <div className="relative aspect-[2/3] bg-muted">
                        <img
                          src={normalizePosterUrl(rec.recommended_item.poster_url) || ""}
                          alt={rec.recommended_item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                        {/* Score Badge */}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          {rec.score.toFixed(0)}
                        </div>

                        {/* Cross-Media Badge */}
                        {rec.cross_media && rec.based_on && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Cross
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[2/3] bg-muted flex items-center justify-center">
                        <Icon className={`w-12 h-12 ${colorClass} opacity-50`} />
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Icon className={`w-3 h-3 ${colorClass}`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {rec.recommended_item.type}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {rec.recommended_item.title}
                      </h3>

                      {(rec.recommended_item.author || rec.recommended_item.artist) && (
                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          {rec.recommended_item.author || rec.recommended_item.artist}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {rec.reason}
                      </p>

                      {rec.based_on && (
                        <div className="flex items-start gap-1 text-xs text-primary">
                          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">
                            Based on your love of {rec.based_on.title}
                          </span>
                        </div>
                      )}

                      {rec.recommended_item.genre && rec.recommended_item.genre.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.recommended_item.genre.slice(0, 2).map((genre: string) => (
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
        </motion.div>
      )}

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 border border-primary/20 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-primary/10"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-lg flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">What Makes This Special?</h3>
            <p className="text-muted-foreground mb-4">
              Unlike other platforms that only recommend within their own catalog, Kindred analyzes
              your taste across ALL media types to find truly personalized recommendations. Love
              cyberpunk anime? We'll find you cyberpunk books, movies, and music too.
            </p>
            <Link
              href="/taste-dna"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Learn more about your Taste DNA
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
