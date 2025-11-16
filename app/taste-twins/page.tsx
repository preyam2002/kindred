"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Star,
  Heart,
  Eye,
} from "lucide-react";

interface TasteTwin {
  user_id: string;
  username: string;
  compatibility_score: number;
  shared_favorites: number;
  shared_genres: string[];
  influence_score: number;
  recommendations_from_them: number;
}

interface RecommendationInfluencer {
  user_id: string;
  username: string;
  influence_percentage: number;
  shared_items: number;
  compatibility: number;
}

export default function TasteTwinsPage() {
  const { data: session, status } = useSession();
  const [tasteTwins, setTasteTwins] = useState<TasteTwin[]>([]);
  const [influencers, setInfluencers] = useState<RecommendationInfluencer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [twinsRes, influencersRes] = await Promise.all([
        fetch("/api/taste-twins"),
        fetch("/api/taste-twins/influencers"),
      ]);

      if (twinsRes.ok) {
        const data = await twinsRes.json();
        setTasteTwins(data.twins || []);
      }

      if (influencersRes.ok) {
        const data = await influencersRes.json();
        setInfluencers(data.influencers || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Finding your taste twins...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Your Taste Twins
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover users with incredibly similar taste and see who influences your recommendations
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="paper-card p-6">
              <Users className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Find Twins</h3>
              <p className="text-sm text-muted-foreground">
                Users with 90%+ taste compatibility
              </p>
            </div>
            <div className="paper-card p-6">
              <TrendingUp className="w-8 h-8 text-secondary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">See Influence</h3>
              <p className="text-sm text-muted-foreground">
                Who shapes your recommendations
              </p>
            </div>
            <div className="paper-card p-6">
              <Sparkles className="w-8 h-8 text-accent mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Discover Together</h3>
              <p className="text-sm text-muted-foreground">
                Follow their taste for new finds
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Find Twins
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
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          Collaborative Filtering Transparency
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Your Taste Twins & Influencers
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          See exactly who has similar taste and who influences your personalized recommendations.
          Our algorithm is transparent!
        </p>
      </motion.div>

      {/* Recommendation Influencers */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-secondary" />
          Who Shapes Your Recommendations
        </h2>
        <p className="text-muted-foreground mb-6">
          These users have the biggest influence on what we recommend to you. The more similar
          your tastes, the more weight their preferences have.
        </p>

        {influencers.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Influencers Yet</h3>
            <p className="text-muted-foreground">
              Rate more items to find users with similar taste
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {influencers.map((influencer, index) => (
              <motion.div
                key={influencer.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="paper-card p-6 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center font-bold text-lg">
                    {influencer.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {influencer.username}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {influencer.compatibility}% compatible
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {influencer.shared_items} shared favorites
                      </span>
                    </div>

                    {/* Influence Percentage */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Recommendation Influence</span>
                        <span className="text-primary font-bold">
                          {influencer.influence_percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${influencer.influence_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Taste Twins */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Your Taste Twins (90%+ Compatible)
        </h2>
        <p className="text-muted-foreground mb-6">
          These users have incredibly similar taste to you. What they love, you'll probably love too!
        </p>

        {tasteTwins.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Taste Twins Yet</h3>
            <p className="text-muted-foreground mb-6">
              Rate more items to find users with 90%+ compatibility
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Go to Library
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {tasteTwins.map((twin, index) => (
              <motion.div
                key={twin.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="paper-card p-6 hover:border-primary/50 transition-all hover:-translate-y-1"
              >
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center font-bold text-2xl">
                    {twin.username.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{twin.username}</h3>
                  <div className="font-display text-3xl font-bold text-primary mb-2">
                    {twin.compatibility_score}%
                  </div>
                  <div className="text-xs text-muted-foreground">Compatibility</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shared Favorites:</span>
                    <span className="font-medium">{twin.shared_favorites}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recommendations:</span>
                    <span className="font-medium">{twin.recommendations_from_them}</span>
                  </div>
                </div>

                {twin.shared_genres.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-2">Shared Genres:</div>
                    <div className="flex flex-wrap gap-1">
                      {twin.shared_genres.slice(0, 3).map((genre, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
