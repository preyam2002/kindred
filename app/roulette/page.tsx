"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Heart,
  X,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react";

interface RouletteRecommendation {
  id: string;
  title: string;
  cover_image?: string;
  poster_url?: string;
  genre?: string[];
  author?: string;
  artist?: string;
  year?: number;
  description?: string;
  media_type: string;
}

interface RouletteResponse {
  recommendations: RouletteRecommendation[];
  genre_used: string | null;
  media_type: string;
}

export default function RoulettePage() {
  const { data: session, status } = useSession();
  const [spinning, setSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<RouletteRecommendation[]>([]);
  const [genreUsed, setGenreUsed] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      spin();
    }
  }, [status]);

  const spin = async () => {
    setSpinning(true);
    setShowResults(false);
    setCurrentIndex(0);
    setSaved(new Set());

    try {
      const res = await fetch("/api/roulette/spin");
      if (res.ok) {
        const data: RouletteResponse = await res.json();

        // Simulate spinning animation
        setTimeout(() => {
          setRecommendations(data.recommendations);
          setGenreUsed(data.genre_used);
          setMediaType(data.media_type);
          setSpinning(false);
          setShowResults(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Error spinning roulette:", error);
      setSpinning(false);
    }
  };

  const handleSave = async () => {
    const current = recommendations[currentIndex];
    if (!current) return;

    try {
      const res = await fetch("/api/roulette/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_id: current.id,
          media_type: current.media_type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setSaved(new Set([...saved, current.id]));

        setTimeout(() => {
          setMessage("");
          handleNext();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All done, show summary
      setShowResults(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
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
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Recommendation Roulette
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Spin the wheel and discover personalized recommendations based on your taste
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="paper-card p-6">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Based on your taste profile
              </p>
            </div>
            <div className="paper-card p-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Fresh Picks</h3>
              <p className="text-sm text-muted-foreground">
                New recommendations every spin
              </p>
            </div>
            <div className="paper-card p-6">
              <Heart className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Swipe to Save</h3>
              <p className="text-sm text-muted-foreground">
                Save favorites to your library
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Spin
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const currentItem = recommendations[currentIndex];

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Feeling Lucky?
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Recommendation Roulette
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Spin the wheel for personalized recommendations based on your unique taste
        </p>
      </motion.div>

      {/* Spinning Animation */}
      {spinning && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-32 h-32 mb-8"
          >
            <div className="w-full h-full rounded-full border-8 border-primary/20 border-t-primary" />
          </motion.div>
          <div className="text-xl font-semibold text-muted-foreground">
            Spinning the wheel...
          </div>
        </motion.div>
      )}

      {/* Results */}
      {!spinning && !showResults && recommendations.length === 0 && (
        <div className="text-center py-20">
          <button
            onClick={spin}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg"
          >
            <Sparkles className="w-6 h-6" />
            Spin the Wheel
          </button>
        </div>
      )}

      {!spinning && !showResults && recommendations.length > 0 && saved.size > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="paper-card p-12 text-center"
        >
          <Star className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Great Choices!</h2>
          <p className="text-lg text-muted-foreground mb-8">
            You saved {saved.size} recommendation{saved.size !== 1 ? "s" : ""} to your library
          </p>
          <button
            onClick={spin}
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" />
            Spin Again
          </button>
        </motion.div>
      )}

      {/* Swipe Cards */}
      <AnimatePresence mode="wait">
        {showResults && currentItem && (
          <motion.div
            key={currentIndex}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="relative"
          >
            <div className="paper-card overflow-hidden">
              {/* Image */}
              {(currentItem.cover_image || currentItem.poster_url) && (
                <div className="aspect-[2/3] relative bg-muted">
                  <img
                    src={currentItem.cover_image || currentItem.poster_url}
                    alt={currentItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-background/90 backdrop-blur rounded-full text-sm font-medium">
                    {currentIndex + 1} / {recommendations.length}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
                    {mediaType}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{currentItem.title}</h2>
                  {currentItem.author && (
                    <p className="text-muted-foreground">by {currentItem.author}</p>
                  )}
                  {currentItem.artist && (
                    <p className="text-muted-foreground">by {currentItem.artist}</p>
                  )}
                  {currentItem.year && (
                    <p className="text-muted-foreground">({currentItem.year})</p>
                  )}
                </div>

                {currentItem.genre && currentItem.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentItem.genre.map((g, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-accent rounded-full text-sm"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {currentItem.description && (
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {currentItem.description}
                  </p>
                )}

                {genreUsed && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <TrendingUp className="w-4 h-4" />
                      <span>Recommended because you like <strong>{genreUsed}</strong></span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleSkip}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-border rounded-lg hover:bg-accent transition-colors font-semibold"
                  >
                    <X className="w-5 h-5" />
                    Skip
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    <Heart className="w-5 h-5" />
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-500 text-white rounded-full shadow-lg font-semibold"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin Again Button (when viewing cards) */}
      {showResults && (
        <div className="text-center mt-8">
          <button
            onClick={spin}
            className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Spin Again
          </button>
        </div>
      )}
    </div>
  );
}
