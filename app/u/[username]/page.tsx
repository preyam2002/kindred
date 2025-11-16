"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, Film, Music, Tv, Share2, Link2, Copy, Check } from "lucide-react";
import type { User, UserMedia, MediaItem } from "@/types/database";
import { generateTweetText, generateTwitterShareUrl, copyToClipboard } from "@/lib/share";
import { ChallengeFriend } from "@/components/challenge-friend";
import { normalizePosterUrl } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [media, setMedia] = useState<(UserMedia & { media_items: MediaItem })[]>([]);
  const [selectedType, setSelectedType] = useState<"all" | "book" | "anime" | "manga" | "movie" | "music">("all");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${username}`);
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setMedia(data.media || []);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const filteredMedia = media.filter((item) => {
    if (selectedType === "all") return true;
    return item.media_items?.type === selectedType;
  });

  const typeCounts = {
    all: media.length,
    book: media.filter((m) => m.media_items?.type === "book").length,
    anime: media.filter((m) => m.media_items?.type === "anime").length,
    manga: media.filter((m) => m.media_items?.type === "manga").length,
    movie: media.filter((m) => m.media_items?.type === "movie").length,
    music: media.filter((m) => m.media_items?.type === "music").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
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
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-start gap-6 mb-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-border bg-muted flex items-center justify-center text-2xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">@{user.username}</h1>
              {user.bio && (
                <p className="text-muted-foreground text-lg mb-4">{user.bio}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {session?.user?.username && session.user.username !== username && (
                  <Link
                    href={`/${session.user.username}/${username}`}
                    className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    Compare with me
                  </Link>
                )}
                <button
                  onClick={async () => {
                    const shareText = `Check out my profile on @kindred and see our compatibility! 🎬📚🎵`;
                    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}`;
                    const tweetUrl = generateTwitterShareUrl(shareText, profileUrl);
                    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Profile
                </button>
                <button
                  onClick={async () => {
                    const mashUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/mash/${username}`;
                    const success = await copyToClipboard(mashUrl);
                    if (success) {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Copy Mash Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Challenge Friend - only show if viewing own profile or if logged in */}
        {session?.user?.username === username && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <ChallengeFriend username={username} />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {[
            { key: "all", label: "All", icon: null },
            { key: "book", label: "Books", icon: BookOpen },
            { key: "anime", label: "Anime", icon: Tv },
            { key: "manga", label: "Manga", icon: BookOpen },
            { key: "movie", label: "Movies", icon: Film },
            { key: "music", label: "Music", icon: Music },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedType(key as typeof selectedType)}
              className={`px-4 py-2 rounded-md border transition-colors flex items-center gap-2 ${
                selectedType === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:bg-accent"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label} ({typeCounts[key as keyof typeof typeCounts]})
            </button>
          ))}
        </motion.div>

        {/* Media Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredMedia.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
            >
              {item.media_items?.poster_url ? (
                <img
                  src={normalizePosterUrl(item.media_items.poster_url) || ""}
                  alt={item.media_items.title}
                  className="w-full aspect-[2/3] object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector(".fallback-placeholder")) {
                      const fallback = document.createElement("div");
                      fallback.className = "fallback-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center";
                      fallback.innerHTML = '<div class="text-4xl">🎬</div>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                  <div className="text-4xl">📚</div>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-sm truncate mb-1">
                  {item.media_items?.title}
                </h3>
                {item.rating && (
                  <div className="text-xs text-muted-foreground">
                    ⭐ {item.rating}/10
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredMedia.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No {selectedType === "all" ? "" : selectedType}{" "}
            {selectedType === "all" ? "media" : ""} found
          </div>
        )}
      </div>
    </div>
  );
}

