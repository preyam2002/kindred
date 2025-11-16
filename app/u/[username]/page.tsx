"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Star,
  Flame,
  Trophy,
  Calendar,
  ArrowLeft,
  Heart,
  TrendingUp,
  Award,
  ListChecks,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface UserProfile {
  user: {
    username: string;
    member_since: string;
  };
  stats: {
    total_items: number;
    books: number;
    anime: number;
    manga: number;
    movies: number;
    music: number;
    avg_rating: number;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
    total_points: number;
    level: number;
  };
  top_genres: Array<{ genre: string; count: number }>;
  top_items: Array<{
    id: string;
    type: string;
    title: string;
    poster_url?: string;
    rating: number;
  }>;
  compatibility?: {
    score: number;
    shared_items: number;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(\`/api/users/\${username}\`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to load profile");
        }
        return;
      }
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." fullScreen />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <ErrorMessage
          title="Profile Not Found"
          message={error || "This user doesn't exist"}
          onRetry={loadProfile}
          showRetry={false}
        />
      </div>
    );
  }

  const isOwnProfile = session?.user?.username === username;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border-b border-border">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold mb-3"
              >
                @{profile.user.username}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground flex items-center gap-2 mb-4"
              >
                <Calendar className="w-4 h-4" />
                Member for {formatDistanceToNow(new Date(profile.user.member_since))}
              </motion.p>
              {!isOwnProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href={`/u/${username}/queue`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <ListChecks className="w-4 h-4" />
                    View Queue & Vote
                  </Link>
                </motion.div>
              )}
            </div>

            {profile.compatibility && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {profile.compatibility.score}%
                </div>
                <div className="text-sm text-muted-foreground">Compatibility</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {profile.compatibility.shared_items} shared items
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="paper-card p-6">
            <div className="text-3xl font-bold text-primary mb-2">
              {profile.stats.total_items}
            </div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="paper-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <div className="text-3xl font-bold">{profile.streak.current_streak}</div>
            </div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          <div className="paper-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div className="text-3xl font-bold">{profile.streak.level}</div>
            </div>
            <div className="text-sm text-muted-foreground">Level</div>
          </div>
          <div className="paper-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <div className="text-3xl font-bold">{profile.stats.avg_rating.toFixed(1)}</div>
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </div>
        </motion.div>

        {/* Library Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="paper-card p-8 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Library Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Books", count: profile.stats.books },
              { label: "Anime", count: profile.stats.anime },
              { label: "Manga", count: profile.stats.manga },
              { label: "Movies", count: profile.stats.movies },
              { label: "Music", count: profile.stats.music },
            ].map(({ label, count }) => (
              <div
                key={label}
                className="text-center p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="text-3xl font-bold mb-1">{count}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Genres */}
        {profile.top_genres.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="paper-card p-8 mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Top Genres
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.top_genres.map((genre, index) => (
                <div
                  key={index}
                  className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2"
                >
                  <span className="font-semibold">{genre.genre}</span>
                  <span className="text-sm text-muted-foreground">({genre.count})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Rated Items */}
        {profile.top_items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="paper-card p-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              Top Rated Items
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {profile.top_items.map((item) => (
                <Link
                  key={item.id}
                  href={\`/media/\${item.type}/\${item.id}\`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2">
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {item.type === "book" ? "📚" : item.type === "movie" ? "🎬" : "🎵"}
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur rounded text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {item.rating}
                    </div>
                  </div>
                  <div className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
