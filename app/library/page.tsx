"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, Film, Music, Tv, ArrowLeft } from "lucide-react";
import type { UserMedia, MediaItem } from "@/types/database";
import { normalizePosterUrl } from "@/lib/utils";

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [media, setMedia] = useState<(UserMedia & { media_items: MediaItem | null })[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get initial filter from URL query parameter
  const urlType = searchParams.get("type");
  const [selectedType, setSelectedType] = useState<"all" | "book" | "anime" | "manga" | "movie" | "music">(
    (urlType as typeof selectedType) || "all"
  );

  useEffect(() => {
    // Update filter when URL changes
    const urlType = searchParams.get("type");
    if (urlType && ["all", "book", "anime", "manga", "movie", "music"].includes(urlType)) {
      setSelectedType(urlType as typeof selectedType);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const res = await fetch("/api/library");
        if (res.ok) {
          const data = await res.json();
          setMedia(data.media || []);
        }
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchLibrary();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

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

  const handleTypeChange = (type: typeof selectedType) => {
    setSelectedType(type);
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`/library?${params.toString()}`, { scroll: false });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            Browse your collection of books, movies, music, and more
          </p>
        </motion.div>

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
              onClick={() => handleTypeChange(key as typeof selectedType)}
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {filteredMedia.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors cursor-pointer"
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
                  <div className="text-4xl">
                    {item.media_items?.type === "book" ? "📚" : 
                     item.media_items?.type === "movie" ? "🎬" : 
                     item.media_items?.type === "music" ? "🎵" : 
                     item.media_items?.type === "anime" ? "📺" : "📖"}
                  </div>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-sm truncate mb-1">
                  {item.media_items?.title || "Unknown"}
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
            <p className="text-lg mb-2">
              No {selectedType === "all" ? "" : selectedType}{" "}
              {selectedType === "all" ? "media" : ""} found
            </p>
            <p className="text-sm">
              Connect integrations to start building your library
            </p>
            <Link
              href="/settings"
              className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
            >
              Connect Integrations
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

