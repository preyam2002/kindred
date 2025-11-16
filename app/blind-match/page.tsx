"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  X,
  MessageCircle,
  Sparkles,
  Users,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

interface BlindMatch {
  id: string;
  compatibility_score: number;
  shared_genres: string[];
  shared_favorites_count: number;
  chat_unlocked: boolean;
  profile_revealed: boolean;
  username?: string;
  bio?: string;
  avatar_url?: string;
  match_date: string;
}

interface Candidate {
  user_id: string;
  compatibility_score: number;
  shared_genres: string[];
  top_genres: string[];
  personality_match: number;
}

export default function BlindMatchPage() {
  const { data: session, status } = useSession();
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [matches, setMatches] = useState<BlindMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [candidateRes, matchesRes] = await Promise.all([
        fetch("/api/blind-match/next"),
        fetch("/api/blind-match/matches"),
      ]);

      if (candidateRes.ok) {
        const data = await candidateRes.json();
        setCurrentCandidate(data.candidate);
      }

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (!currentCandidate || animating) return;

    setAnimating(true);

    if (liked) {
      try {
        const res = await fetch("/api/blind-match/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_user_id: currentCandidate.user_id,
            liked: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.matched) {
            // Show match notification
            alert("It's a match! Check your matches below.");
            fetchData();
          }
        }
      } catch (error) {
        console.error("Error swiping:", error);
      }
    }

    // Load next candidate
    setTimeout(async () => {
      const res = await fetch("/api/blind-match/next");
      if (res.ok) {
        const data = await res.json();
        setCurrentCandidate(data.candidate);
      } else {
        setCurrentCandidate(null);
      }
      setAnimating(false);
    }, 500);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Heart className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Blind Match
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Match with people based purely on taste compatibility. Profiles revealed only after meaningful connection.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="paper-card p-6">
              <Lock className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Anonymous Matching</h3>
              <p className="text-sm text-muted-foreground">
                No photos or names until you match
              </p>
            </div>
            <div className="paper-card p-6">
              <Sparkles className="w-8 h-8 text-secondary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Taste First</h3>
              <p className="text-sm text-muted-foreground">
                Match based on what you love, not how you look
              </p>
            </div>
            <div className="paper-card p-6">
              <MessageCircle className="w-8 h-8 text-accent mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Chat to Unlock</h3>
              <p className="text-sm text-muted-foreground">
                Profiles reveal through conversation
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Start Matching
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
          <Heart className="w-4 h-4" />
          Blind Match
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Match on Taste, Not Looks
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Swipe on anonymous profiles. Match based on compatibility. Reveal through conversation.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Swipe Area */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {currentCandidate ? (
              <motion.div
                key={currentCandidate.user_id}
                initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                transition={{ duration: 0.3 }}
                className="paper-card p-8 corner-brackets"
              >
                {/* Anonymized Profile */}
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-border">
                    <EyeOff className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-2">
                    Anonymous User
                  </h2>
                  <p className="text-muted-foreground">
                    Profile will be revealed after matching
                  </p>
                </div>

                {/* Compatibility Score */}
                <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-border">
                  <div className="text-center">
                    <div className="font-display text-6xl font-bold text-primary mb-2">
                      {currentCandidate.compatibility_score}%
                    </div>
                    <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
                      Taste Compatibility
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {currentCandidate.personality_match}% Personality Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shared Interests */}
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Shared Taste
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCandidate.shared_genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Their Top Genres */}
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    Their Top Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCandidate.top_genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-muted border border-border rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => handleSwipe(false)}
                    disabled={animating}
                    className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 hover:border-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    <X className="w-8 h-8 text-red-500" />
                  </button>
                  <button
                    onClick={() => handleSwipe(true)}
                    disabled={animating}
                    className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 hover:border-primary hover:bg-primary/20 transition-all flex items-center justify-center disabled:opacity-50 hover:scale-110"
                  >
                    <Heart className="w-10 h-10 text-primary" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="paper-card p-16 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold mb-2">No More Candidates</h3>
                <p className="text-muted-foreground mb-6">
                  Check back later for new potential matches!
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="stamp bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Refresh
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Matches Sidebar */}
        <div>
          <div className="paper-card p-6 sticky top-6">
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Your Matches
            </h3>

            {matches.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">
                  No matches yet. Keep swiping!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-muted/30 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        {match.profile_revealed ? (
                          <Eye className="w-5 h-5 text-primary" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {match.profile_revealed
                            ? match.username || "User"
                            : "Anonymous Match"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {match.compatibility_score}% compatible
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {match.shared_favorites_count} shared favorites
                      </span>
                      {match.chat_unlocked ? (
                        <MessageCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
