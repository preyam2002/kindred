"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Challenge {
  id: string;
  userId: string;
  username: string;
  items: Array<{
    id: string;
    title: string;
    type: string;
    poster_url?: string;
    rating: number;
  }>;
  createdAt: string;
  challengeUrl: string;
}

export default function TasteChallengePage() {
  const { data: session, status } = useSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (challenge) {
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

          <div className="text-center mt-8">
            <button
              onClick={() => setChallenge(null)}
              className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Create Another Challenge
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
        <div className="text-center animate-fadeInUp animate-delay-200">
          <div className="paper-card p-12 rule-double">
            <h2 className="font-display text-3xl font-bold mb-6">Ready to challenge your friends?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              We'll create a personalized challenge based on your library. It takes just seconds!
            </p>
            <button
              onClick={createChallenge}
              disabled={loading}
              className="stamp bg-primary text-primary-foreground text-lg hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 inline animate-spin" />
                  Creating Challenge...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 mr-2 inline" />
                  Create My Challenge
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
