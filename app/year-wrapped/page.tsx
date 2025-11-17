"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Share2,
  Trophy,
  TrendingUp,
  Calendar,
  Heart,
  Star,
  Zap,
  Crown,
  Target,
  Download,
} from "lucide-react";
import { normalizePosterUrl } from "@/lib/utils";

interface WrappedData {
  year: number;
  stats: {
    total_items: number;
    total_anime: number;
    total_manga: number;
    total_books: number;
    total_movies: number;
    total_music: number;
    average_rating: number;
    items_loved: number;
  };
  top_genre: {
    name: string;
    count: number;
  };
  top_items: Array<{
    title: string;
    type: string;
    poster_url?: string;
    rating: number;
  }>;
  taste_personality: {
    mainstream_score: number;
    diversity_score: number;
    enthusiasm_score: number;
  };
  badges: string[];
  fun_facts: string[];
}

const Card = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.5, delay }}
    className="w-full max-w-md mx-auto aspect-[9/16] relative overflow-hidden"
  >
    {children}
  </motion.div>
);

export default function YearWrappedPage() {
  const { data: session, status } = useSession();
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState(0);
  const totalCards = 8;

  useEffect(() => {
    if (status === "authenticated") {
      generateWrapped();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const generateWrapped = async () => {
    try {
      const res = await fetch("/api/year-wrapped/generate");
      if (res.ok) {
        const data = await res.json();
        setWrappedData(data);
      }
    } catch (error) {
      console.error("Error generating wrapped:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const handleShare = async () => {
    const text = `Check out my Kindred ${wrappedData?.year || 2024} Wrapped! 🎉`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Year Wrapped", text, url });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-lg font-semibold">Generating your wrapped...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Calendar className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Your Year in Review
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Sign in to see your personalized wrapped for {new Date().getFullYear()}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to View Wrapped
          </Link>
        </div>
      </div>
    );
  }

  if (!wrappedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Not Enough Data</h1>
          <p className="text-muted-foreground mb-6">
            Add more items to your library and rate them to generate your wrapped!
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Progress dots */}
      <div className="absolute top-6 left-0 right-0 flex justify-center gap-1 z-10">
        {Array.from({ length: totalCards }).map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all ${
              index === currentCard
                ? "w-8 bg-white"
                : index < currentCard
                ? "w-6 bg-white/60"
                : "w-6 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevCard}
        disabled={currentCard === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-0 transition-opacity hover:bg-black/30"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextCard}
        disabled={currentCard === totalCards - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-0 transition-opacity hover:bg-black/30"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Cards */}
      <AnimatePresence mode="wait">
        {currentCard === 0 && (
          <Card key="welcome">
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/70 flex flex-col items-center justify-center text-white p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Sparkles className="w-20 h-20 mb-8" />
              </motion.div>
              <h1 className="font-display text-6xl font-bold mb-4 text-center">
                {wrappedData.year}
              </h1>
              <p className="text-3xl font-light text-center mb-8">Wrapped</p>
              <div className="text-center text-xl">
                Your year in taste
              </div>
            </div>
          </Card>
        )}

        {currentCard === 1 && (
          <Card key="total-items">
            <div className="w-full h-full bg-gradient-to-br from-accent/80 to-primary/80 flex flex-col items-center justify-center text-white p-8">
              <div className="text-center">
                <p className="text-2xl mb-6">This year, you experienced</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="font-display text-9xl font-bold mb-6"
                >
                  {wrappedData.stats.total_items}
                </motion.div>
                <p className="text-3xl font-semibold">items</p>
                <div className="mt-12 space-y-2 text-lg opacity-90">
                  {wrappedData.stats.total_anime > 0 && (
                    <div>{wrappedData.stats.total_anime} anime</div>
                  )}
                  {wrappedData.stats.total_manga > 0 && (
                    <div>{wrappedData.stats.total_manga} manga</div>
                  )}
                  {wrappedData.stats.total_books > 0 && (
                    <div>{wrappedData.stats.total_books} books</div>
                  )}
                  {wrappedData.stats.total_movies > 0 && (
                    <div>{wrappedData.stats.total_movies} movies</div>
                  )}
                  {wrappedData.stats.total_music > 0 && (
                    <div>{wrappedData.stats.total_music} songs</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentCard === 2 && (
          <Card key="top-genre">
            <div className="w-full h-full bg-gradient-to-br from-secondary/70 to-accent/70 flex flex-col items-center justify-center text-white p-8">
              <Crown className="w-16 h-16 mb-6" />
              <p className="text-2xl mb-6 text-center">Your most-watched genre was</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="font-display text-6xl font-bold mb-6 text-center"
              >
                {wrappedData.top_genre.name}
              </motion.div>
              <div className="text-xl opacity-90">
                {wrappedData.top_genre.count} items
              </div>
            </div>
          </Card>
        )}

        {currentCard === 3 && (
          <Card key="top-items">
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-accent/80 flex flex-col items-center justify-center text-white p-8">
              <Trophy className="w-12 h-12 mb-4" />
              <h2 className="text-3xl font-bold mb-8 text-center">Your Top Picks</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {wrappedData.top_items.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative aspect-[2/3] rounded overflow-hidden"
                  >
                    {item.poster_url ? (
                      <img
                        src={normalizePosterUrl(item.poster_url) || ""}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center text-xs p-1 text-center">
                        {item.title}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-center text-xs">
                      {item.rating}/10
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-sm opacity-75 text-center">
                These were your highest-rated {wrappedData.year} discoveries
              </p>
            </div>
          </Card>
        )}

        {currentCard === 4 && (
          <Card key="love-stat">
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-accent/80 flex flex-col items-center justify-center text-white p-8">
              <Heart className="w-16 h-16 mb-6 fill-current" />
              <p className="text-2xl mb-6 text-center">You absolutely loved</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="font-display text-9xl font-bold mb-4"
              >
                {wrappedData.stats.items_loved}
              </motion.div>
              <p className="text-3xl font-semibold mb-6">items</p>
              <p className="text-xl opacity-90">
                That's {Math.round((wrappedData.stats.items_loved / wrappedData.stats.total_items) * 100)}% of everything you watched!
              </p>
            </div>
          </Card>
        )}

        {currentCard === 5 && (
          <Card key="personality">
            <div className="w-full h-full bg-gradient-to-br from-primary/70 via-secondary/60 to-accent/70 flex flex-col items-center justify-center text-white p-8">
              <Target className="w-12 h-12 mb-6" />
              <h2 className="text-3xl font-bold mb-8 text-center">Your Taste Personality</h2>

              <div className="w-full space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">Mainstream</span>
                    <span className="text-sm">{wrappedData.taste_personality.mainstream_score}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${wrappedData.taste_personality.mainstream_score}%` }}
                      transition={{ delay: 0.3, duration: 1 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">Diversity</span>
                    <span className="text-sm">{wrappedData.taste_personality.diversity_score}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${wrappedData.taste_personality.diversity_score}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">Enthusiasm</span>
                    <span className="text-sm">{wrappedData.taste_personality.enthusiasm_score}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${wrappedData.taste_personality.enthusiasm_score}%` }}
                      transition={{ delay: 0.7, duration: 1 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm opacity-75 mt-8 text-center">
                Your unique mix of taste preferences
              </p>
            </div>
          </Card>
        )}

        {currentCard === 6 && (
          <Card key="fun-facts">
            <div className="w-full h-full bg-gradient-to-br from-secondary/70 to-accent/70 flex flex-col items-center justify-center text-white p-8">
              <Zap className="w-12 h-12 mb-6" />
              <h2 className="text-3xl font-bold mb-8 text-center">Fun Facts</h2>

              <div className="space-y-6 w-full">
                {wrappedData.fun_facts.map((fact, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-white/20 backdrop-blur-sm rounded-lg p-4"
                  >
                    <p className="text-lg">{fact}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {currentCard === 7 && (
          <Card key="finale">
            <div className="w-full h-full bg-gradient-to-br from-primary/80 via-secondary/70 to-accent/80 flex flex-col items-center justify-center text-white p-8">
              <Sparkles className="w-16 h-16 mb-6" />
              <h2 className="text-4xl font-bold mb-6 text-center">
                What a year!
              </h2>
              <p className="text-xl mb-8 text-center opacity-90">
                You earned these badges for {wrappedData.year}
              </p>

              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {wrappedData.badges.map((badge, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold"
                  >
                    {badge}
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-full font-semibold hover:bg-white/90 transition-all hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                Share Your Wrapped
              </button>

              <Link
                href="/dashboard"
                className="mt-6 text-sm opacity-75 hover:opacity-100 transition-opacity"
              >
                Back to Dashboard
              </Link>
            </div>
          </Card>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      {currentCard < totalCards - 1 && (
        <div className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm">
          Tap or use arrows to continue
        </div>
      )}
    </div>
  );
}
