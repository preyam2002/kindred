"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Trophy,
  Heart,
  X,
  Star,
  TrendingUp,
  Share2,
  Target,
  ArrowRight,
} from "lucide-react";
import { normalizePosterUrl } from "@/lib/utils";

interface ChallengeItem {
  id: string;
  title: string;
  type: string;
  poster_url?: string;
  rating: number;
  author?: string;
  artist?: string;
}

interface Challenge {
  id: string;
  userId: string;
  username: string;
  items: ChallengeItem[];
  createdAt: string;
}

interface CompatibilityResult {
  score: number;
  percentage: number;
  message: string;
  breakdown: {
    exact_matches: number;
    close_matches: number;
    total_items: number;
  };
  badges: string[];
}

export default function TakeChallengePage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`/api/taste-challenge/${challengeId}`);
      if (res.ok) {
        const data = await res.json();
        setChallenge(data);
      } else {
        console.error("Challenge not found");
      }
    } catch (error) {
      console.error("Error fetching challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = (rating: number) => {
    if (!challenge) return;

    const currentItem = challenge.items[currentIndex];
    const newRatings = new Map(ratings);
    newRatings.set(currentItem.id, rating);
    setRatings(newRatings);

    if (currentIndex < challenge.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitChallenge(newRatings);
    }
  };

  const submitChallenge = async (finalRatings: Map<string, number>) => {
    if (!challenge) return;

    setSubmitting(true);
    try {
      const ratingsArray = challenge.items.map((item) => ({
        itemId: item.id,
        userRating: finalRatings.get(item.id) || 5,
        originalRating: item.rating,
      }));

      const res = await fetch("/api/taste-challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          ratings: ratingsArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Error submitting challenge:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Loading challenge...</div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Challenge Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This challenge doesn't exist or has expired.
          </p>
          <Link
            href="/taste-challenge"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Your Own Challenge
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-3xl">
          {/* Results Header */}
          <div className="text-center mb-12 animate-fadeInUp">
            <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-display text-5xl font-bold mb-3 letterpress">
              {result.percentage}% Compatible
            </h1>
            <p className="text-lg text-muted-foreground">
              with <span className="font-semibold text-foreground">{challenge.username}</span>'s taste
            </p>
          </div>

          {/* Score Card */}
          <div className="paper-card p-10 mb-8 corner-brackets text-center animate-fadeInUp animate-delay-100">
            <div className="font-mono text-8xl font-bold text-primary mb-4 animate-countUp">
              {result.score}
            </div>
            <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-6">
              Compatibility Score
            </div>
            <p className="text-lg font-medium mb-6">{result.message}</p>

            {/* Badges */}
            {result.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {result.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8 animate-fadeInUp animate-delay-200">
            <div className="paper-card p-6 text-center">
              <div className="font-mono text-3xl font-bold text-primary mb-2">
                {result.breakdown.exact_matches}
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Exact Matches
              </div>
            </div>
            <div className="paper-card p-6 text-center">
              <div className="font-mono text-3xl font-bold text-secondary mb-2">
                {result.breakdown.close_matches}
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Close Matches
              </div>
            </div>
            <div className="paper-card p-6 text-center">
              <div className="font-mono text-3xl font-bold mb-2">
                {result.breakdown.total_items}
              </div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Items Rated
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="paper-card p-8 text-center animate-fadeInUp animate-delay-300">
            <h2 className="font-display text-2xl font-bold mb-4">
              Want to create your own challenge?
            </h2>
            <p className="text-muted-foreground mb-6">
              Sign up to Kindred and challenge your friends with your unique taste!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/taste-challenge">
                <button className="stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1">
                  <Trophy className="w-4 h-4 mr-2 inline" />
                  Create My Challenge
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="stamp border-2 border-border hover:bg-accent/10 transition-all hover:-translate-y-1">
                  Sign Up for Free
                </button>
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => {
                setResult(null);
                setRatings(new Map());
                setCurrentIndex(0);
              }}
              className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Take the challenge again →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-lg font-semibold mb-2">Calculating compatibility...</div>
          <div className="text-muted-foreground">Comparing your taste with {challenge.username}</div>
        </div>
      </div>
    );
  }

  const currentItem = challenge.items[currentIndex];
  const progress = ((currentIndex + 1) / challenge.items.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            Challenge from <span className="text-foreground font-semibold">{challenge.username}</span>
          </div>
          <div className="font-mono text-sm font-medium">
            {currentIndex + 1} / {challenge.items.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted border border-border overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Rating Card */}
      <div className="w-full max-w-md mb-8">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="paper-card border-2 overflow-hidden"
        >
          {/* Image */}
          <div className="relative h-96 bg-muted/50">
            {currentItem.poster_url ? (
              <img
                src={normalizePosterUrl(currentItem.poster_url) || ""}
                alt={currentItem.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}

            {/* Type Badge */}
            <div className="absolute top-4 left-4 stamp bg-primary text-primary-foreground text-xs capitalize">
              {currentItem.type}
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            <h2 className="font-display text-2xl font-bold mb-2 letterpress">
              {currentItem.title}
            </h2>
            {(currentItem.author || currentItem.artist) && (
              <p className="text-sm text-muted-foreground mb-4">
                {currentItem.author || currentItem.artist}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              How would you rate this {currentItem.type}?
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating Buttons */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => handleRate(3)}
          className="w-16 h-16 paper-card card-tactile flex items-center justify-center border-2 border-accent/30 hover:border-accent transition-all hover:scale-110"
        >
          <X className="w-8 h-8 text-accent" />
        </button>

        <button
          onClick={() => handleRate(5)}
          className="w-16 h-16 paper-card card-tactile flex items-center justify-center border-2 border-muted-foreground/30 hover:border-muted-foreground transition-all hover:scale-110"
        >
          <span className="text-2xl">😐</span>
        </button>

        <button
          onClick={() => handleRate(7)}
          className="w-16 h-16 paper-card card-tactile flex items-center justify-center border-2 border-secondary/30 hover:border-secondary transition-all hover:scale-110"
        >
          <Star className="w-8 h-8 text-secondary" />
        </button>

        <button
          onClick={() => handleRate(10)}
          className="w-20 h-20 paper-card card-tactile flex items-center justify-center border-2 border-primary/30 hover:border-primary transition-all hover:scale-110"
        >
          <Heart className="w-10 h-10 text-primary" />
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center max-w-md">
        <p className="font-mono text-sm text-muted-foreground mb-3">
          Rate each item honestly
        </p>
        <div className="flex items-center justify-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1">
            <X className="w-3 h-3 text-accent" /> Not for me
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sm">😐</span> Neutral
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-secondary" /> Like it
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-primary" /> Love it
          </span>
        </div>
      </div>
    </div>
  );
}
