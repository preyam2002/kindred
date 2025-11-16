"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  X,
  Star,
  SkipForward,
  ArrowLeft,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";
import Link from "next/link";
import { getRandomDemoMedia, DemoMediaItem } from "@/lib/demo-data";

export default function DemoPage() {
  const [media, setMedia] = useState<DemoMediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Map<string, number>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    // Load 15 random items
    const items = getRandomDemoMedia(15);
    setMedia(items);
  }, []);

  const currentItem = media[currentIndex];
  const progress = ((currentIndex + 1) / media.length) * 100;

  const handleRate = (rating: number) => {
    if (!currentItem) return;

    const newRatings = new Map(ratings);
    newRatings.set(currentItem.id, rating);
    setRatings(newRatings);

    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAudioPlaying(false);
    } else {
      setShowResults(true);
    }
  };

  const handleSkip = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAudioPlaying(false);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAudioPlaying(false);
    }
  };

  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying);
    // In production, actually play/pause audio here
  };

  if (media.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (showResults) {
    return <ResultsView ratings={ratings} media={media} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back
          </Link>
          <div className="font-mono text-sm font-medium">
            {currentIndex + 1} / {media.length}
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

      {/* Card */}
      <div className="relative w-full max-w-md h-[600px] mb-8">
        <SwipeCard
          item={currentItem}
          onRate={handleRate}
          onSkip={handleSkip}
          audioPlaying={audioPlaying}
          toggleAudio={toggleAudio}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-5 mb-10">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="w-12 h-12 paper-card flex items-center justify-center transition-all hover:-translate-y-1 disabled:opacity-30 disabled:hover:translate-y-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleRate(3)}
          className="w-20 h-20 paper-card card-tactile flex items-center justify-center border-2 border-accent/30 hover:border-accent transition-all hover:scale-105"
        >
          <X className="w-10 h-10 text-accent" />
        </button>

        <button
          onClick={() => handleRate(7)}
          className="w-20 h-20 paper-card card-tactile flex items-center justify-center border-2 border-secondary/30 hover:border-secondary transition-all hover:scale-105"
        >
          <Star className="w-10 h-10 text-secondary" />
        </button>

        <button
          onClick={() => handleRate(10)}
          className="w-20 h-20 paper-card card-tactile flex items-center justify-center border-2 border-primary/30 hover:border-primary transition-all hover:scale-105"
        >
          <Heart className="w-10 h-10 text-primary" />
        </button>

        <button
          onClick={handleSkip}
          className="w-12 h-12 paper-card flex items-center justify-center transition-all hover:-translate-y-1"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center max-w-md">
        <p className="font-mono text-sm text-muted-foreground mb-3 tracking-wide">
          Rate items to discover your taste profile
        </p>
        <div className="flex items-center justify-center gap-6 text-xs font-medium">
          <span className="flex items-center gap-2">
            <X className="w-3 h-3 text-accent" /> Not for me
          </span>
          <span className="flex items-center gap-2">
            <Star className="w-3 h-3 text-secondary" /> It's okay
          </span>
          <span className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-primary" /> Love it!
          </span>
        </div>
      </div>
    </div>
  );
}

function SwipeCard({
  item,
  onRate,
  onSkip,
  audioPlaying,
  toggleAudio,
}: {
  item: DemoMediaItem;
  onRate: (rating: number) => void;
  onSkip: () => void;
  audioPlaying: boolean;
  toggleAudio: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 100;

    if (info.offset.x > swipeThreshold) {
      // Swiped right - love it
      onRate(10);
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped left - not for me
      onRate(3);
    }
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-full h-full overflow-hidden paper-card border-2">
        {/* Image */}
        <div className="relative h-96 bg-muted/50">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a simple data URI placeholder if image fails to load
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'%3E%3Crect fill='%23f3f4f6' width='400' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='monospace' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />

          {/* Play button for music */}
          {item.type === "music" && item.spotifyUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAudio();
              }}
              className="absolute top-4 right-4 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              {audioPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
          )}

          {/* Type Badge */}
          <div className="absolute top-4 left-4 stamp bg-primary text-primary-foreground text-xs">
            {item.type}
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <h2 className="font-display text-2xl font-bold mb-2 letterpress">{item.title}</h2>

          <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground mb-4">
            {item.year && <span>{item.year}</span>}
            {item.artist && (
              <>
                <span>•</span>
                <span>{item.artist}</span>
              </>
            )}
            {item.author && (
              <>
                <span>•</span>
                <span>{item.author}</span>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {item.description}
          </p>

          {item.genres && item.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-muted border border-border text-xs font-mono font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ResultsView({
  ratings,
  media,
}: {
  ratings: Map<string, number>;
  media: DemoMediaItem[];
}) {
  const ratedItems = Array.from(ratings.entries()).map(([id, rating]) => ({
    item: media.find((m) => m.id === id)!,
    rating,
  }));

  const loved = ratedItems.filter((r) => r.rating >= 8);
  const liked = ratedItems.filter((r) => r.rating >= 5 && r.rating < 8);
  const disliked = ratedItems.filter((r) => r.rating < 5);

  // Calculate taste profile
  const typeBreakdown = ratedItems.reduce((acc, { item }) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const favoriteType = Object.entries(typeBreakdown).sort(
    ([, a], [, b]) => b - a
  )[0];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-5xl font-bold mb-4 letterpress">Your Taste Profile</h1>
          <p className="font-mono text-xl text-muted-foreground">
            Based on your {ratedItems.length} ratings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12 animate-fadeInUp animate-delay-100">
          <div className="paper-card p-8 text-center card-tactile">
            <div className="font-mono text-4xl font-bold text-primary mb-2 animate-countUp">
              {loved.length}
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Loved</div>
          </div>
          <div className="paper-card p-8 text-center card-tactile">
            <div className="font-mono text-4xl font-bold text-secondary mb-2 animate-countUp animate-delay-100">
              {liked.length}
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Liked</div>
          </div>
          <div className="paper-card p-8 text-center card-tactile">
            <div className="font-mono text-4xl font-bold text-accent mb-2 animate-countUp animate-delay-200">
              {disliked.length}
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Not for you</div>
          </div>
        </div>

        {/* Taste Insights */}
        <div className="mb-12 animate-fadeInUp animate-delay-200">
          <div className="paper-card p-8 corner-brackets">
            <h2 className="font-display text-3xl font-bold mb-6 letterpress">Your Taste Insights</h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p className="flex items-start gap-3">
                <span className="text-primary text-xl">✦</span>
                <span>You rated <span className="font-mono font-semibold text-foreground">{ratedItems.length}</span> items across{" "}
                <span className="font-mono font-semibold text-foreground">{Object.keys(typeBreakdown).length}</span> categories</span>
              </p>
              {favoriteType && (
                <p className="flex items-start gap-3">
                  <span className="text-secondary text-xl">∞</span>
                  <span>Your favorite category is{" "}
                  <span className="font-display font-semibold text-foreground">
                    {favoriteType[0]}
                  </span>{" "}
                  (<span className="font-mono">{favoriteType[1]}</span> items)</span>
                </p>
              )}
              <p className="flex items-start gap-3">
                <span className="text-accent text-xl">⚡</span>
                <span>You loved <span className="font-mono font-semibold text-foreground">{((loved.length / ratedItems.length) * 100).toFixed(0)}%</span> of
                what you rated</span>
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fadeInUp animate-delay-300">
          <div className="paper-card p-12 rule-double">
            <h2 className="font-display text-4xl font-bold mb-6 letterpress">
              Ready to find your kindred spirits?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Sign up to discover users with your exact taste, get personalized
              recommendations, and connect through what you love
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Link href="/auth/signup">
                <button className="stamp bg-primary text-primary-foreground text-lg hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-lg">
                  Sign Up - It's Free
                </button>
              </Link>
              <Link href="/waitlist">
                <button className="stamp border-2 border-secondary text-secondary hover:bg-secondary/10 text-lg transition-all hover:-translate-y-1">
                  Join Waitlist
                </button>
              </Link>
            </div>

            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Import from Goodreads · MAL · Letterboxd · Spotify
            </p>
          </div>
        </div>

        {/* Try Again */}
        <div className="text-center mt-8">
          <Link
            href="/demo"
            className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Try again with different items →
          </Link>
        </div>
      </div>
    </div>
  );
}
