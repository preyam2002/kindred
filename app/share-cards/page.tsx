"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Share2,
  Download,
  Sparkles,
  ArrowRight,
  Trophy,
  Palette,
  TrendingUp,
  Users,
  Flame,
} from "lucide-react";
import html2canvas from "html2canvas";

interface ShareCardData {
  username: string;
  cardType: string;
  title: string;
  items?: Array<{
    title: string;
    cover?: string;
    rating: number;
    type: string;
  }>;
  profile?: {
    top_genres: string[];
    mainstream_score: number;
    diversity_score: number;
    total_items: number;
    avg_rating: number;
  };
  stats?: {
    total_items: number;
    top_genre: string;
    avg_rating: number;
    streak: number;
    matches_count: number;
  };
  compatibility?: {
    match_username: string;
    score: number;
    shared_items: number;
  };
  streak?: {
    current_streak: number;
    level: number;
    total_points: number;
  };
}

const CARD_TYPES = [
  {
    id: "top10",
    name: "Top 10 Favorites",
    icon: Trophy,
    description: "Showcase your highest-rated items",
  },
  {
    id: "taste_profile",
    name: "Taste DNA",
    icon: Palette,
    description: "Visual representation of your taste",
  },
  {
    id: "year_stats",
    name: "Year Wrapped",
    icon: TrendingUp,
    description: "Your year in review",
  },
  {
    id: "compatibility",
    name: "Compatibility",
    icon: Users,
    description: "Share your best match",
  },
  {
    id: "streak",
    name: "Streak Stats",
    icon: Flame,
    description: "Show off your dedication",
  },
];

export default function ShareCardsPage() {
  const { data: session, status } = useSession();
  const [selectedType, setSelectedType] = useState("top10");
  const [cardData, setCardData] = useState<ShareCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadCardData(selectedType);
    }
  }, [status, selectedType]);

  const loadCardData = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/share-cards/generate?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setCardData(data);
      }
    } catch (error) {
      console.error("Error loading card data:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `kindred-${selectedType}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Error downloading card:", error);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "kindred-card.png", { type: "image/png" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: cardData?.title || "My Kindred Card",
              text: "Check out my taste profile on Kindred!",
              files: [file],
            });
          } catch (err) {
            console.error("Share failed:", err);
            downloadCard();
          }
        } else {
          downloadCard();
        }
      });
    } catch (error) {
      console.error("Error sharing card:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Generating your card...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Share2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Social Share Cards
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Create beautiful, shareable cards to show off your taste
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {CARD_TYPES.slice(0, 3).map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="paper-card p-6">
                  <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              );
            })}
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Create Cards
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
          <Share2 className="w-4 h-4" />
          Share Your Taste
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Social Share Cards
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create beautiful cards to share your taste profile with the world
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Card Type Selector */}
        <div className="lg:col-span-1">
          <div className="paper-card p-6 sticky top-6">
            <h3 className="font-display text-xl font-bold mb-6">Card Types</h3>

            <div className="space-y-3">
              {CARD_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold mb-1">{type.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Preview */}
        <div className="lg:col-span-2">
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Card */}
            <div
              ref={cardRef}
              className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 p-12 rounded-2xl shadow-2xl aspect-square flex items-center justify-center"
            >
              {cardData && <CardContent data={cardData} />}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={downloadCard}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={shareCard}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-semibold"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CardContent({ data }: { data: ShareCardData }) {
  switch (data.cardType) {
    case "top10":
      return (
        <div className="w-full text-center">
          <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
          <div className="grid grid-cols-5 gap-4">
            {data.items?.slice(0, 10).map((item, i) => (
              <div key={i} className="relative">
                {item.cover ? (
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-center px-2">{item.title}</span>
                  </div>
                )}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {item.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "taste_profile":
      return (
        <div className="w-full text-center">
          <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
          <div className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Top Genres</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.profile?.top_genres.map((genre, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-primary/20 rounded-full font-semibold"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-primary">
                  {data.profile?.mainstream_score}%
                </div>
                <div className="text-sm text-muted-foreground">Mainstream</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">
                  {data.profile?.diversity_score}%
                </div>
                <div className="text-sm text-muted-foreground">Diversity</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">
                  {data.profile?.avg_rating.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      );

    case "year_stats":
      return (
        <div className="w-full text-center">
          <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="p-6 bg-background/50 rounded-xl">
              <div className="text-5xl font-bold text-primary mb-2">
                {data.stats?.total_items}
              </div>
              <div className="text-muted-foreground">Items Rated</div>
            </div>
            <div className="p-6 bg-background/50 rounded-xl">
              <div className="text-3xl font-bold text-primary mb-2">
                {data.stats?.top_genre}
              </div>
              <div className="text-muted-foreground">Top Genre</div>
            </div>
            <div className="p-6 bg-background/50 rounded-xl">
              <div className="text-5xl font-bold text-primary mb-2">
                {data.stats?.streak}
              </div>
              <div className="text-muted-foreground">Day Streak</div>
            </div>
            <div className="p-6 bg-background/50 rounded-xl">
              <div className="text-5xl font-bold text-primary mb-2">
                {data.stats?.matches_count}
              </div>
              <div className="text-muted-foreground">Taste Matches</div>
            </div>
          </div>
        </div>
      );

    case "compatibility":
      return (
        <div className="w-full text-center">
          <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
          <div className="relative">
            <div className="text-8xl font-bold text-primary mb-4">
              {data.compatibility?.score}%
            </div>
            <div className="text-xl text-muted-foreground mb-8">
              Taste Compatibility
            </div>
            <div className="p-6 bg-background/50 rounded-xl">
              <div className="text-sm text-muted-foreground mb-2">
                Perfect Match
              </div>
              <div className="text-2xl font-bold">
                {data.compatibility?.match_username}
              </div>
            </div>
          </div>
        </div>
      );

    case "streak":
      return (
        <div className="w-full text-center">
          <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
          <div className="space-y-8">
            <div>
              <Flame className="w-20 h-20 mx-auto mb-4 text-orange-500" />
              <div className="text-7xl font-bold text-primary mb-2">
                {data.streak?.current_streak}
              </div>
              <div className="text-xl text-muted-foreground">Day Streak</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-background/50 rounded-xl">
                <div className="text-3xl font-bold text-primary mb-1">
                  Level {data.streak?.level}
                </div>
                <div className="text-sm text-muted-foreground">Current Level</div>
              </div>
              <div className="p-4 bg-background/50 rounded-xl">
                <div className="text-3xl font-bold text-primary mb-1">
                  {data.streak?.total_points}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
