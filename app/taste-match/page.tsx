"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart,
  X,
  Sparkles,
  Star,
  BookOpen,
  Film,
  Music,
  Tv,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface UserCandidate {
  user: {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  compatibility: {
    overall_score: number;
    genre_overlap_score: number;
    rating_correlation: number;
    shared_items_count: number;
    anime_compatibility: number;
    manga_compatibility: number;
    book_compatibility: number;
    movie_compatibility: number;
    music_compatibility: number;
  };
  taste_highlights: {
    shared_genres: string[];
    similar_favorites: Array<{
      title: string;
      type: string;
      both_rating: number;
    }>;
  };
}

export default function TasteMatchPage() {
  const { data: session, status } = useSession();
  const [candidates, setCandidates] = useState<UserCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchNotification, setMatchNotification] = useState<string | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const res = await fetch("/api/taste-match/candidates");
        if (res.ok) {
          const data = await res.json();
          setCandidates(data.candidates || []);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchCandidates();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleSwipe = async (direction: "left" | "right") => {
    const candidate = candidates[currentIndex];
    if (!candidate) return;

    const action = direction === "right" ? "like" : "pass";

    try {
      const res = await fetch("/api/taste-match/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: candidate.user.id,
          action,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.matched) {
          setMatchNotification(candidate.user.username);
          setTimeout(() => setMatchNotification(null), 3000);
        }
      }
    } catch (error) {
      console.error("Error recording swipe:", error);
    }

    // Move to next candidate
    setCurrentIndex((prev) => prev + 1);
    x.set(0);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      handleSwipe(info.offset.x > 0 ? "right" : "left");
    } else {
      x.set(0);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Finding your taste matches...</div>
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

  const currentCandidate = candidates[currentIndex];

  if (!currentCandidate && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">No Matches Yet</h1>
          <p className="text-muted-foreground mb-6">
            We're calculating compatibility with other users. Check back soon to start finding your taste twins!
          </p>
          <Link
            href="/taste-dna"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            View Your Taste DNA
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!currentCandidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Award className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">All Caught Up!</h1>
          <p className="text-muted-foreground mb-6">
            You've reviewed all potential matches. Check your matches or come back later for more!
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              View Matches
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, compatibility, taste_highlights } = currentCandidate;
  const score = compatibility.overall_score;

  // Get media type icons
  const mediaTypeData = [
    { type: "anime", score: compatibility.anime_compatibility, icon: Tv },
    { type: "manga", score: compatibility.manga_compatibility, icon: BookOpen },
    { type: "book", score: compatibility.book_compatibility, icon: BookOpen },
    { type: "movie", score: compatibility.movie_compatibility, icon: Film },
    { type: "music", score: compatibility.music_compatibility, icon: Music },
  ].filter((item) => item.score > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Match Notification */}
      {matchNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-bold">
            It's a match with @{matchNotification}!
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Taste Match Swiper</h1>
        <p className="text-muted-foreground">
          Swipe right on users with similar taste
        </p>
        <div className="text-sm text-muted-foreground mt-2">
          {currentIndex + 1} / {candidates.length}
        </div>
      </div>

      {/* Swipeable Card */}
      <div className="relative h-[600px] mb-8">
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{
            x,
            rotate,
            opacity,
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full border-2 border-border rounded-2xl overflow-hidden bg-card shadow-xl">
            {/* User Header */}
            <div className="relative p-6 bg-gradient-to-br from-primary/20 to-primary/5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-background"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted flex items-center justify-center text-4xl border-4 border-background">
                  {user.username[0].toUpperCase()}
                </div>
              )}

              <h2 className="text-2xl font-bold text-center mb-1">
                @{user.username}
              </h2>

              {user.bio && (
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {user.bio}
                </p>
              )}

              {/* Compatibility Score */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6 text-primary fill-current" />
                <span className="text-4xl font-bold text-primary">
                  {score.toFixed(0)}
                </span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Compatibility Score
              </div>
            </div>

            {/* Compatibility Breakdown */}
            <div className="p-6 space-y-6">
              {/* Media Type Compatibility */}
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Media Compatibility
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {mediaTypeData.map(({ type, score, icon: Icon }) => (
                    <div
                      key={type}
                      className="text-center border border-border rounded-lg p-2"
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-xs font-bold">{score.toFixed(0)}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Genres */}
              {taste_highlights.shared_genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2">Shared Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {taste_highlights.shared_genres.slice(0, 6).map((genre) => (
                      <div
                        key={genre}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                      >
                        {genre}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Favorites */}
              {taste_highlights.similar_favorites.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-current" />
                    You Both Love
                  </h3>
                  <div className="space-y-2">
                    {taste_highlights.similar_favorites.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm border border-border rounded-lg p-2"
                      >
                        <span className="font-medium truncate flex-1">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-bold">
                            {item.both_rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {compatibility.shared_items_count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Shared Items
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(compatibility.rating_correlation * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rating Match
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Swipe Indicators */}
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 opacity-50">
          <X className="w-16 h-16 text-red-500" />
        </div>
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 opacity-50">
          <Heart className="w-16 h-16 text-green-500" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6">
        <button
          onClick={() => handleSwipe("left")}
          className="w-16 h-16 rounded-full border-2 border-red-500 bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>

        <button
          onClick={() => handleSwipe("right")}
          className="w-20 h-20 rounded-full border-2 border-green-500 bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors"
        >
          <Heart className="w-10 h-10 text-green-500" />
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        <p>Swipe right to like • Swipe left to pass</p>
        <p className="mt-1">When you both like each other, it's a match!</p>
      </div>
    </div>
  );
}
