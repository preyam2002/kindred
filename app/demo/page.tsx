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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back
          </Link>
          <div className="text-sm font-medium">
            {currentIndex + 1} / {media.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
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
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="rounded-full w-14 h-14"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => handleRate(3)}
          className="rounded-full w-16 h-16 border-2 border-red-500/20 hover:bg-red-500/10 hover:border-red-500"
        >
          <X className="w-8 h-8 text-red-500" />
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => handleRate(7)}
          className="rounded-full w-16 h-16 border-2 border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500"
        >
          <Star className="w-8 h-8 text-yellow-500" />
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => handleRate(10)}
          className="rounded-full w-16 h-16 border-2 border-green-500/20 hover:bg-green-500/10 hover:border-green-500"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={handleSkip}
          className="rounded-full w-14 h-14"
        >
          <SkipForward className="w-6 h-6" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p className="mb-2">Rate items to discover your taste profile</p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <X className="w-3 h-3 text-red-500" /> Not for me
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" /> It's okay
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-green-500" /> Love it!
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
      <Card className="w-full h-full overflow-hidden bg-card border-2">
        {/* Image */}
        <div className="relative h-96 bg-muted">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-image.jpg";
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
          <div className="absolute top-4 left-4 px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary-foreground">
            {item.type.toUpperCase()}
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{item.title}</h2>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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
                  className="px-2 py-1 bg-muted rounded-md text-xs"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Your Taste Profile</h1>
          <p className="text-xl text-muted-foreground">
            Based on your {ratedItems.length} ratings
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {loved.length}
            </div>
            <div className="text-sm text-muted-foreground">Loved</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {liked.length}
            </div>
            <div className="text-sm text-muted-foreground">Liked</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">
              {disliked.length}
            </div>
            <div className="text-sm text-muted-foreground">Not for you</div>
          </Card>
        </motion.div>

        {/* Taste Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-purple-500/10">
            <h2 className="text-2xl font-bold mb-4">Your Taste Insights</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                ✨ You rated {ratedItems.length} items across{" "}
                {Object.keys(typeBreakdown).length} categories
              </p>
              {favoriteType && (
                <p>
                  🎯 Your favorite category is{" "}
                  <span className="font-semibold text-foreground">
                    {favoriteType[0]}
                  </span>{" "}
                  ({favoriteType[1]} items)
                </p>
              )}
              <p>
                💚 You loved {((loved.length / ratedItems.length) * 100).toFixed(0)}% of
                what you rated
              </p>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Card className="p-12 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <h2 className="text-3xl font-bold mb-4">
              Ready to find your kindred spirits?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sign up to discover users with your exact taste, get personalized
              recommendations, and connect through what you love
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Sign Up - It's Free
                </Button>
              </Link>
              <Link href="/waitlist">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                >
                  Join Waitlist
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Import your full library from Goodreads, MAL, Letterboxd & Spotify
            </p>
          </Card>
        </motion.div>

        {/* Try Again */}
        <div className="text-center mt-8">
          <Link
            href="/demo"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Try again with different items →
          </Link>
        </div>
      </div>
    </div>
  );
}
