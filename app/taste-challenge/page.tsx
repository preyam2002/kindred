"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  Trophy,
  Target,
  Users,
  ArrowRight,
  Eye,
  RefreshCw,
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

interface ChallengeItem {
  id: string;
  title: string;
  type: string;
  poster_url?: string;
  rating: number;
}

interface Challenge {
  id: string;
  userId?: string;
  username: string;
  items: ChallengeItem[];
  createdAt: string;
  challengeUrl?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export default function TasteChallengePage() {
  const { data: session, status } = useSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [preview, setPreview] = useState<ChallengeItem[] | null>(null);
  const [existingChallenges, setExistingChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"main" | "preview" | "success">("main");

  useEffect(() => {
    if (status === "authenticated") {
      loadExistingChallenges();
    }
  }, [status]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/taste-challenge/preview");
      if (res.ok) {
        const data = await res.json();
        setPreview(data.items);
        setView("preview");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to load preview");
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadExistingChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const res = await fetch("/api/taste-challenge/list");
      if (res.ok) {
        const data = await res.json();
        setExistingChallenges(data.challenges || []);
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const createChallenge = async () => {
    if (status !== "authenticated") {
      alert("Please sign in to create a challenge");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/taste-challenge/create", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setChallenge(data);
        setView("success");
        loadExistingChallenges(); // Refresh the list
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create challenge");
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!challenge) return;

    const url = `${window.location.origin}/taste-challenge/${challenge.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (!challenge) return;

    const url = `${window.location.origin}/taste-challenge/${challenge.id}`;
    const text = `Can you match my taste? Take my Kindred challenge and see how compatible we are!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Taste Challenge", text, url });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      handleCopy();
    }
  };

  if (status === "loading") {
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
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Taste Compatibility Challenge
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Challenge your friends to match your taste and see how compatible you are!
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Create Challenge
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Preview View
  if (view === "preview" && preview) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => setView("main")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-4">
                <Eye className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-4xl font-bold mb-3">
                Preview Your Challenge
              </h1>
              <p className="text-muted-foreground">
                These are the {preview.length} items that will be in your challenge
              </p>
            </div>

            {/* Preview Items */}
            <div className="paper-card p-8 mb-6">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                {preview.map((item, index) => (
                  <div
                    key={index}
                    className="relative aspect-[2/3] bg-muted rounded overflow-hidden group"
                  >
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                        {item.title}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-1 text-center">
                      <span className="text-xs font-mono font-bold text-white">
                        {item.rating}/10
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-center justify-center">
                      <p className="text-white text-xs text-center font-semibold">
                        {item.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Your highest-rated items</span>
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Rated 7+ or higher
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setView("main")}
                className="px-6 py-3 border-2 border-border rounded-lg hover:bg-accent transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={createChallenge}
                disabled={loading}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm & Create Challenge
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success View
  if (view === "success" && challenge) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-4xl">
          {/* Success State */}
          <div className="text-center mb-12 animate-fadeInUp">
            <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-5xl font-bold mb-3 letterpress">
              Challenge Created!
            </h1>
            <p className="text-lg text-muted-foreground">
              Share this challenge with your friends
            </p>
          </div>

          {/* Challenge URL */}
          <div className="paper-card p-8 mb-8 corner-brackets animate-fadeInUp animate-delay-100">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3 block">
              Your Challenge URL
            </label>
            <div className="flex gap-3">
              <Input
                value={`${window.location.origin}/taste-challenge/${challenge.id}`}
                readOnly
                className="font-mono text-sm bg-muted/50 border-2"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={handleShare}
                className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Challenge Preview */}
          <div className="paper-card p-8 mb-8 animate-fadeInUp animate-delay-200">
            <h2 className="font-display text-2xl font-bold mb-6">
              Your Challenge Items ({challenge.items.length})
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {challenge.items.map((item, index) => (
                <div
                  key={index}
                  className="relative aspect-[2/3] bg-muted rounded overflow-hidden"
                >
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                      {item.title}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-1 text-center">
                    <span className="text-xs font-mono font-bold text-white">
                      {item.rating}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="paper-card p-6 animate-fadeInUp animate-delay-300">
            <h3 className="font-display text-xl font-bold mb-4">How It Works</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Share the link with friends and challenge them to rate your favorite items
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <span>
                  They'll rate each item and get a compatibility score showing how similar
                  your tastes are
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>
                  The more they agree with your ratings, the higher the compatibility!
                </span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-8 flex gap-4 justify-center">
            <button
              onClick={() => {
                setChallenge(null);
                setView("main");
              }}
              className="px-6 py-3 border-2 border-border rounded-lg hover:bg-accent transition-colors font-semibold"
            >
              Back to Challenges
            </button>
            <button
              onClick={() => {
                setChallenge(null);
                setPreview(null);
                loadPreview();
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-block stamp bg-primary text-primary-foreground mb-8">
            🎯 Challenge Mode
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 letterpress">
            Taste Compatibility Challenge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Think you and your friends have similar taste? Create a challenge and find out!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fadeInUp animate-delay-100">
          <div className="paper-card p-6 card-tactile">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Rate Your Favorites</h3>
            <p className="text-sm text-muted-foreground">
              We'll select items from your library that you've rated highly
            </p>
          </div>

          <div className="paper-card p-6 card-tactile">
            <div className="w-12 h-12 bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Share the Challenge</h3>
            <p className="text-sm text-muted-foreground">
              Send your unique link to friends and see how they rate
            </p>
          </div>

          <div className="paper-card p-6 card-tactile">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Get Compatibility Score</h3>
            <p className="text-sm text-muted-foreground">
              Instant results showing exactly how much your tastes align
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fadeInUp animate-delay-200 mb-12">
          <div className="paper-card p-12 rule-double">
            <h2 className="font-display text-3xl font-bold mb-6">Ready to challenge your friends?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              We'll create a personalized challenge based on your library. Preview before sharing!
            </p>
            <button
              onClick={loadPreview}
              disabled={loadingPreview}
              className="stamp bg-primary text-primary-foreground text-lg hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
            >
              {loadingPreview ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 inline animate-spin" />
                  Loading Preview...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2 inline" />
                  Preview My Challenge
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Challenges */}
        {existingChallenges.length > 0 && (
          <div className="animate-fadeInUp animate-delay-300">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Your Challenges
            </h2>
            <div className="space-y-4">
              {existingChallenges.map((c) => (
                <div
                  key={c.id}
                  className="paper-card p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        Challenge by @{c.username}
                      </h3>
                      {c.isActive ? (
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground border border-border rounded">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {c.items.length} items
                      </span>
                      <span>
                        Created {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyChallenge(c.id)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/taste-challenge/${c.id}`}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function handleCopyChallenge(challengeId: string) {
    const url = `${window.location.origin}/taste-challenge/${challengeId}`;
    navigator.clipboard.writeText(url).then(() => {
      // Show a brief success indicator
      alert("Challenge link copied!");
    });
  }
}
