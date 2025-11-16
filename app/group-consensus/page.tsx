"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Star,
  Check,
  X as XIcon,
  Sparkles,
  TrendingUp,
  BookOpen,
  Film,
  Music,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePosterUrl } from "@/lib/utils";

interface Candidate {
  id: string;
  media: {
    title: string;
    type: string;
    poster_url?: string;
    genre?: string[];
  };
  votes: number;
  predicted_rating: number;
}

export default function GroupConsensusPage() {
  const { data: session, status } = useSession();
  const [sessionActive, setSessionActive] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState<string>("all");

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mediaType !== "all") {
        params.append("mediaTypes", mediaType);
      }
      params.append("limit", "6");

      const res = await fetch(`/api/group-consensus/suggest?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
        setSessionActive(true);
      }
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (candidateId: string, direction: "up" | "down") => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, votes: c.votes + (direction === "up" ? 1 : -1) }
          : c
      )
    );
  };

  const handleReset = () => {
    setSessionActive(false);
    setCandidates([]);
    setMediaType("all");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Loading...</div>
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

  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const winner = sortedCandidates.length > 0 ? sortedCandidates[0] : null;

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
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          Group Decision Making
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Group Consensus Picker
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Can't decide what to watch with friends? Let us suggest options based on everyone's taste,
          then vote together to find the perfect match!
        </p>
      </motion.div>

      {!sessionActive ? (
        /* Setup Screen */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="border border-border rounded-xl p-8 bg-card">
            <h2 className="text-2xl font-bold mb-6">Start a New Session</h2>

            <div className="space-y-6">
              {/* Media Type Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  What type of media are you looking for?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { value: "all", label: "All Types", icon: Sparkles },
                    { value: "anime", label: "Anime", icon: Tv },
                    { value: "manga", label: "Manga", icon: BookOpen },
                    { value: "movie", label: "Movies", icon: Film },
                    { value: "book", label: "Books", icon: BookOpen },
                    { value: "music", label: "Music", icon: Music },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMediaType(value)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        mediaType === value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How it works:</p>
                    <ul className="space-y-1">
                      <li>• We analyze your library to suggest great options</li>
                      <li>• Vote on each suggestion with your group</li>
                      <li>• The most popular choice wins!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Finding Options...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Get Suggestions
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Voting Screen */
        <div>
          {/* Winner Banner */}
          {winner && winner.votes > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 border-2 border-primary rounded-xl bg-gradient-to-br from-primary/10 to-primary/5"
            >
              <div className="flex items-center gap-4">
                <Trophy className="w-12 h-12 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">Current Leader</div>
                  <div className="text-2xl font-bold">{winner.media.title}</div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {winner.votes} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      {winner.predicted_rating.toFixed(1)} predicted rating
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Voting Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sortedCandidates.map((candidate, index) => {
              const Icon = getMediaIcon(candidate.media.type);

              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-2 rounded-xl overflow-hidden bg-card transition-all ${
                    candidate.id === winner?.id && candidate.votes > 0
                      ? "border-primary shadow-lg"
                      : "border-border"
                  }`}
                >
                  {/* Poster */}
                  {candidate.media.poster_url ? (
                    <div className="relative aspect-[16/9]">
                      <img
                        src={normalizePosterUrl(candidate.media.poster_url) || ""}
                        alt={candidate.media.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                      {candidate.id === winner?.id && candidate.votes > 0 && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          Leader
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                      <Icon className="w-16 h-16 text-muted-foreground opacity-50" />
                    </div>
                  )}

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">
                        {candidate.media.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {candidate.media.title}
                    </h3>

                    {candidate.media.genre && candidate.media.genre.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.media.genre.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-0.5 bg-muted rounded text-xs"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Predicted Rating */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span>{candidate.predicted_rating.toFixed(1)} predicted rating</span>
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(candidate.id, "up")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="font-bold">{candidate.votes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(candidate.id, "down")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Pass
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleReset} size="lg">
              <XIcon className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            {winner && winner.votes > 0 && (
              <Button size="lg">
                <Check className="w-4 h-4 mr-2" />
                Finalize: {winner.media.title}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16 border border-primary/20 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-primary/10"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-lg flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Smart Suggestions</h3>
            <p className="text-muted-foreground mb-4">
              Our algorithm analyzes your library preferences to suggest media that you're
              likely to enjoy together. The predicted rating shows how well we think your group
              will like each option based on your combined taste profiles.
            </p>
            <Link
              href="/taste-dna"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Learn more about your Taste DNA
              <TrendingUp className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
