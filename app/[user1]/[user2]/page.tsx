"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, TrendingUp, Share2, Twitter, Link2, Copy, Check, Brain, Lightbulb } from "lucide-react";
import type { MashScoreResult } from "@/lib/matching";
import type { User } from "@/types/database";
import type { CompatibilityInsight } from "@/lib/insights";
import {
  generateTweetText,
  generateMashUrl,
  generateTwitterShareUrl,
  copyToClipboard,
} from "@/lib/share";
import { ShareButtons } from "@/components/share-buttons";
import { Card } from "@/components/ui/card";
import { normalizePosterUrl } from "@/lib/utils";

export default function MashPage() {
  const params = useParams();
  const user1Name = params.user1 as string;
  const user2Name = params.user2 as string;
  const [user1, setUser1] = useState<User | null>(null);
  const [user2, setUser2] = useState<User | null>(null);
  const [mashResult, setMashResult] = useState<MashScoreResult | null>(null);
  const [insights, setInsights] = useState<CompatibilityInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchMash() {
      try {
        const res = await fetch(`/api/matching/${user1Name}/${user2Name}`);
        const data = await res.json();
        if (res.ok && data.user1 && data.user2 && data.mashResult) {
          setUser1(data.user1);
          setUser2(data.user2);
          setMashResult(data.mashResult);
        } else {
          console.error("Error fetching mash:", data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching mash:", error);
        setLoading(false);
      }
    }

    async function fetchInsights() {
      if (!user1Name || !user2Name) return;
      
      setLoadingInsights(true);
      try {
        const res = await fetch(`/api/insights/${user1Name}/${user2Name}`);
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights);
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setLoadingInsights(false);
      }
    }

    if (user1Name && user2Name) {
      fetchMash();
      fetchInsights();
    }
  }, [user1Name, user2Name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Calculating MashScore...</div>
      </div>
    );
  }

  if (!mashResult || !user1 || !user2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Unable to calculate match</h1>
          <Link href="/" className="text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            Mash: @{user1.username} × @{user2.username}
          </h1>
          <div className="flex items-center justify-center gap-8">
            <Link
              href={`/u/${user1.username}`}
              className="text-primary hover:underline"
            >
              @{user1.username}
            </Link>
            <span className="text-muted-foreground">×</span>
            <Link
              href={`/u/${user2.username}`}
              className="text-primary hover:underline"
            >
              @{user2.username}
            </Link>
          </div>
        </motion.div>

        {/* MashScore Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-border rounded-lg p-12 bg-card mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Sparkles className="w-12 h-12 text-primary" />
            <div>
              <div className="text-6xl font-bold text-primary mb-2">
                {mashResult.score}
              </div>
              <div className="text-xl text-muted-foreground">MashScore</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {mashResult.sharedCount} shared items •{" "}
            {mashResult.recommendations.length} recommendations
          </div>
        </motion.div>

        {/* AI Insights */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="border border-border rounded-lg p-6 bg-card mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">AI Compatibility Insights</h2>
            </div>
            
            {loadingInsights ? (
              <div className="text-muted-foreground">Generating insights...</div>
            ) : (
              <>
                {/* Summary */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {insights.summary}
                </p>

                {/* Highlights */}
                {insights.highlights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Highlights
                    </h3>
                    <ul className="space-y-2">
                      {insights.highlights.map((highlight, index) => (
                        <li key={index} className="text-sm text-muted-foreground pl-6 relative">
                          <span className="absolute left-0 text-primary">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Patterns */}
                {insights.patterns.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3">Patterns</h3>
                    <ul className="space-y-2">
                      {insights.patterns.map((pattern, index) => (
                        <li key={index} className="text-sm text-muted-foreground pl-6 relative">
                          <span className="absolute left-0 text-primary">•</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Insights</h3>
                    <ul className="space-y-2">
                      {insights.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground pl-6 relative">
                          <span className="absolute left-0 text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Shared Items */}
        {mashResult.sharedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Shared Favorites ({mashResult.sharedItems.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mashResult.sharedItems.slice(0, 12).map((item, index) => (
                <motion.div
                  key={item.media.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="border border-border rounded-lg overflow-hidden bg-card"
                >
                  {item.media.poster_url ? (
                    <img
                      src={normalizePosterUrl(item.media.poster_url) || ""}
                      alt={item.media.title}
                      className="w-full aspect-[2/3] object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".fallback-placeholder")) {
                          const fallback = document.createElement("div");
                          fallback.className = "fallback-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center";
                          fallback.innerHTML = '<div class="text-4xl">📚</div>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      📚
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate mb-2">
                      {item.media.title}
                    </h3>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {item.user1Rating && (
                        <span>@{user1.username}: ⭐ {item.user1Rating}</span>
                      )}
                      {item.user2Rating && (
                        <span>@{user2.username}: ⭐ {item.user2Rating}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {mashResult.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6">
              Recommendations for @{user1.username}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mashResult.recommendations.map((rec, index) => (
                <motion.div
                  key={rec.media.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="border border-border rounded-lg overflow-hidden bg-card"
                >
                  {rec.media.poster_url ? (
                    <img
                      src={normalizePosterUrl(rec.media.poster_url) || ""}
                      alt={rec.media.title}
                      className="w-full aspect-[2/3] object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".fallback-placeholder")) {
                          const fallback = document.createElement("div");
                          fallback.className = "fallback-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center";
                          fallback.innerHTML = '<div class="text-4xl">📚</div>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      📚
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate mb-1">
                      {rec.media.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {rec.reason}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Share2 className="w-6 h-6 text-primary" />
                Share Your Match
              </h3>
              <p className="text-muted-foreground">
                Show off your {mashResult.score}% compatibility!
              </p>
            </div>

            <div className="flex justify-center">
              <ShareButtons
                config={{
                  type: "match",
                  url: `${typeof window !== 'undefined' ? window.location.origin : ''}/${user1Name}/${user2Name}`,
                  user1: user1Name,
                  user2: user2Name,
                  score: mashResult.score,
                  sharedCount: mashResult.sharedCount,
                }}
                showLabels={true}
              />
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>OG image preview available at:</p>
              <a
                href={`/api/mash/${user1Name}/${user2Name}/og`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                /api/mash/{user1Name}/{user2Name}/og
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

