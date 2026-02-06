"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Film,
  Music,
  Tv,
  ArrowLeft,
  Search,
  Grid3x3,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Star,
  Calendar,
  TrendingUp,
  Hash,
  Clock,
  Heart,
  Edit2,
  Trash2,
  Play,
  Check,
  Pause,
  X,
} from "lucide-react";
import type { UserMedia, MediaItem } from "@/types/database";
import { normalizePosterUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditMediaDialog } from "@/components/edit-media-dialog";

type MediaType = "all" | "book" | "anime" | "manga" | "movie" | "music";
type ViewMode = "grid" | "list" | "compact";
type SortOption =
  | "date-desc"
  | "date-asc"
  | "rating-desc"
  | "rating-asc"
  | "title-asc"
  | "title-desc";

function LibraryContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [media, setMedia] = useState<
    (UserMedia & { media_items: MediaItem | null })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<[number, number]>([0, 10]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<(UserMedia & { media_items: MediaItem | null }) | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const urlType = searchParams.get("type");
  const [selectedType, setSelectedType] = useState<MediaType>(
    (urlType as MediaType) || "all"
  );

  useEffect(() => {
    const urlType = searchParams.get("type");
    if (
      urlType &&
      ["all", "book", "anime", "manga", "movie", "music"].includes(urlType)
    ) {
      setSelectedType(urlType as MediaType);
    }
  }, [searchParams]);

  const fetchLibrary = async () => {
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
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchLibrary();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleEditItem = (item: UserMedia & { media_items: MediaItem | null }) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleUpdateComplete = () => {
    fetchLibrary();
  };

  // Filter and sort media
  const processedMedia = media
    .filter((item) => {
      // Type filter
      if (
        selectedType !== "all" &&
        item.media_items?.type !== selectedType
      ) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = item.media_items?.title?.toLowerCase() || "";
        const author = (item.media_items as any)?.author?.toLowerCase() || "";
        const artist = (item.media_items as any)?.artist?.toLowerCase() || "";

        if (
          !title.includes(query) &&
          !author.includes(query) &&
          !artist.includes(query)
        ) {
          return false;
        }
      }

      // Rating filter
      if (item.rating !== undefined && item.rating !== null) {
        if (
          item.rating < ratingFilter[0] ||
          item.rating > ratingFilter[1]
        ) {
          return false;
        }
      }

      // Favorites filter
      if (favoritesOnly && !item.is_favorite) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating-desc":
          return (b.rating || 0) - (a.rating || 0);
        case "rating-asc":
          return (a.rating || 0) - (b.rating || 0);
        case "date-desc":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "date-asc":
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        case "title-asc":
          return (a.media_items?.title || "").localeCompare(
            b.media_items?.title || ""
          );
        case "title-desc":
          return (b.media_items?.title || "").localeCompare(
            a.media_items?.title || ""
          );
        default:
          return 0;
      }
    });

  const typeCounts = {
    all: media.length,
    book: media.filter((m) => m.media_items?.type === "book").length,
    anime: media.filter((m) => m.media_items?.type === "anime").length,
    manga: media.filter((m) => m.media_items?.type === "manga").length,
    movie: media.filter((m) => m.media_items?.type === "movie").length,
    music: media.filter((m) => m.media_items?.type === "music").length,
  };

  // Calculate stats
  const ratedItems = processedMedia.filter((i) => i.rating);
  const stats = {
    total: processedMedia.length,
    avgRating:
      ratedItems.length > 0
        ? (
            ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) /
            ratedItems.length
          ).toFixed(1)
        : "0.0",
    topRated: processedMedia.filter((i) => (i.rating || 0) >= 8).length,
    recentlyAdded: processedMedia.filter((i) => {
      const daysSinceAdded =
        (Date.now() - new Date(i.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAdded <= 7;
    }).length,
    favorites: processedMedia.filter((i) => i.is_favorite).length,
    completed: processedMedia.filter(
      (i) => i.status === "completed" || i.status === "reading" || i.status === "watching"
    ).length,
  };

  const handleTypeChange = (type: MediaType) => {
    setSelectedType(type);
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-muted-foreground">Loading your library...</div>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                My Library
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {stats.total} item{stats.total !== 1 ? "s" : ""} in your
                collection
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 border border-border rounded-lg p-1 bg-card">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "compact"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
                title="Compact view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={Hash}
              label="Total"
              value={stats.total.toString()}
            />
            <StatCard
              icon={Star}
              label="Avg Rating"
              value={`${stats.avgRating}/10`}
            />
            <StatCard
              icon={TrendingUp}
              label="Top Rated"
              value={stats.topRated.toString()}
            />
            <StatCard
              icon={Calendar}
              label="This Week"
              value={stats.recentlyAdded.toString()}
            />
            <StatCard
              icon={Heart}
              label="Favorites"
              value={stats.favorites.toString()}
            />
            <StatCard
              icon={Check}
              label="In Progress"
              value={stats.completed.toString()}
            />
          </div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
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
                onClick={() => handleTypeChange(key as MediaType)}
                className={`px-3 sm:px-4 py-2 rounded-md border transition-colors flex items-center gap-2 text-sm ${
                  selectedType === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-accent"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.slice(0, 1)}</span>
                <span className="text-xs opacity-75">
                  ({typeCounts[key as keyof typeof typeCounts]})
                </span>
              </button>
            ))}
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, author, or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-border rounded-md bg-card hover:bg-accent transition-colors text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="rating-asc">Lowest Rated</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card border border-border rounded-lg p-4 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rating Range: {ratingFilter[0]} - {ratingFilter[1]}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={ratingFilter[0]}
                      onChange={(e) =>
                        setRatingFilter([
                          parseInt(e.target.value),
                          ratingFilter[1],
                        ])
                      }
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={ratingFilter[1]}
                      onChange={(e) =>
                        setRatingFilter([
                          ratingFilter[0],
                          parseInt(e.target.value),
                        ])
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="favorites-only"
                    checked={favoritesOnly}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="favorites-only"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Show favorites only
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRatingFilter([0, 10]);
                      setSearchQuery("");
                      setFavoritesOnly(false);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Media Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {processedMedia.map((item, index) => (
                <MediaCardGrid key={item.id} item={item} index={index} onEdit={handleEditItem} />
              ))}
            </div>
          )}

          {viewMode === "list" && (
            <div className="space-y-2 sm:space-y-3">
              {processedMedia.map((item, index) => (
                <MediaCardList key={item.id} item={item} index={index} onEdit={handleEditItem} />
              ))}
            </div>
          )}

          {viewMode === "compact" && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {processedMedia.map((item, index) => (
                <MediaCardCompact key={item.id} item={item} index={index} onEdit={handleEditItem} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {processedMedia.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">
              {searchQuery ||
              ratingFilter[0] > 0 ||
              ratingFilter[1] < 10 ||
              favoritesOnly
                ? "No items match your filters"
                : `No ${selectedType === "all" ? "" : selectedType} ${
                    selectedType === "all" ? "media" : ""
                  } found`}
            </p>
            <p className="text-sm mb-4">
              {searchQuery ||
              ratingFilter[0] > 0 ||
              ratingFilter[1] < 10 ||
              favoritesOnly
                ? "Try adjusting your search or filters"
                : "Connect integrations to start building your library"}
            </p>
            {!searchQuery &&
              ratingFilter[0] === 0 &&
              ratingFilter[1] === 10 &&
              !favoritesOnly && (
                <Link
                  href="/settings"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
                >
                  Connect Integrations
                </Link>
              )}
          </div>
        )}
      </div>

      {/* Edit Media Dialog */}
      {editingItem && (
        <EditMediaDialog
          item={editingItem}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={handleUpdateComplete}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">{label}</span>
      </div>
      <div className="text-lg sm:text-2xl font-bold truncate">{value}</div>
    </div>
  );
}

// Grid View Card Component
function MediaCardGrid({
  item,
  index,
  onEdit,
}: {
  item: UserMedia & { media_items: MediaItem | null };
  index: number;
  onEdit: (item: UserMedia & { media_items: MediaItem | null }) => void;
}) {
  const getStatusBadge = () => {
    if (!item.status) return null;

    const badges: Record<string, { icon: any; label: string; color: string }> =
      {
        completed: { icon: Check, label: "Completed", color: "bg-green-500/20 text-green-400" },
        watching: { icon: Play, label: "Watching", color: "bg-blue-500/20 text-blue-400" },
        reading: { icon: BookOpen, label: "Reading", color: "bg-blue-500/20 text-blue-400" },
        listening: { icon: Music, label: "Listening", color: "bg-purple-500/20 text-purple-400" },
        on_hold: { icon: Pause, label: "On Hold", color: "bg-yellow-500/20 text-yellow-400" },
        dropped: { icon: X, label: "Dropped", color: "bg-red-500/20 text-red-400" },
        plan_to_watch: { icon: Clock, label: "Plan to Watch", color: "bg-gray-500/20 text-gray-400" },
        plan_to_read: { icon: Clock, label: "Plan to Read", color: "bg-gray-500/20 text-gray-400" },
        plan_to_listen: { icon: Clock, label: "Plan to Listen", color: "bg-gray-500/20 text-gray-400" },
      };

    const badge = badges[item.status];
    if (!badge) return null;

    const Icon = badge.icon;
    return (
      <div
        className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${badge.color} backdrop-blur-sm`}
        title={badge.label}
      >
        <Icon className="w-3 h-3" />
        <span className="hidden sm:inline">{badge.label}</span>
      </div>
    );
  };

  const progressPercentage =
    item.progress && item.progress_total
      ? Math.round((item.progress / item.progress_total) * 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      className="group relative border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Poster */}
      <div className="relative">
        {item.media_items?.poster_url ? (
          <img
            src={normalizePosterUrl(item.media_items.poster_url) || ""}
            alt={item.media_items.title}
            className="w-full aspect-[2/3] object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent && !parent.querySelector(".fallback-placeholder")) {
                const fallback = document.createElement("div");
                fallback.className =
                  "fallback-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center";
                fallback.innerHTML = '<div class="text-4xl">🎬</div>';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
            <div className="text-4xl">
              {item.media_items?.type === "book"
                ? "📚"
                : item.media_items?.type === "movie"
                ? "🎬"
                : item.media_items?.type === "music"
                ? "🎵"
                : item.media_items?.type === "anime"
                ? "📺"
                : "📖"}
            </div>
          </div>
        )}

        {/* Status Badge */}
        {getStatusBadge()}

        {/* Favorite Badge */}
        {item.is_favorite && (
          <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white p-1.5 rounded-full">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
          </div>
        )}

        {/* Rating Badge */}
        {item.rating && (
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {item.rating}
          </div>
        )}

        {/* Progress Bar */}
        {progressPercentage !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Edit Button (appears on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm text-white p-1.5 rounded hover:bg-black"
          title="Edit"
        >
          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Details */}
      <div className="p-2 sm:p-3">
        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">
          {item.media_items?.title || "Unknown"}
        </h3>

        {/* Creator/Author */}
        {(item.media_items as any)?.author && (
          <p className="text-xs text-muted-foreground truncate">
            by {(item.media_items as any).author}
          </p>
        )}
        {(item.media_items as any)?.artist && (
          <p className="text-xs text-muted-foreground truncate">
            by {(item.media_items as any).artist}
          </p>
        )}

        {/* Progress Text */}
        {item.progress !== undefined && item.progress_total && (
          <p className="text-xs text-muted-foreground mt-1">
            {item.progress} / {item.progress_total}{" "}
            {item.media_items?.type === "anime"
              ? "eps"
              : item.media_items?.type === "manga"
              ? "ch"
              : ""}
          </p>
        )}

        {/* Genres */}
        {item.media_items?.genre && item.media_items.genre.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.media_items.genre.slice(0, 2).map((genre, i) => (
              <span
                key={i}
                className="text-xs px-1.5 sm:px-2 py-0.5 bg-primary/10 text-primary rounded"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// List View Card Component
function MediaCardList({
  item,
  index,
  onEdit,
}: {
  item: UserMedia & { media_items: MediaItem | null };
  index: number;
  onEdit: (item: UserMedia & { media_items: MediaItem | null }) => void;
}) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const progressPercentage =
    item.progress && item.progress_total
      ? Math.round((item.progress / item.progress_total) * 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.3) }}
      className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Poster Thumbnail */}
      <div className="flex-shrink-0 relative">
        {item.media_items?.poster_url ? (
          <img
            src={normalizePosterUrl(item.media_items.poster_url) || ""}
            alt={item.media_items.title}
            className="w-12 h-18 sm:w-16 sm:h-24 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-18 sm:w-16 sm:h-24 bg-muted flex items-center justify-center rounded text-xl sm:text-2xl">
            {item.media_items?.type === "book"
              ? "📚"
              : item.media_items?.type === "movie"
              ? "🎬"
              : item.media_items?.type === "music"
              ? "🎵"
              : item.media_items?.type === "anime"
              ? "📺"
              : "📖"}
          </div>
        )}
        {item.is_favorite && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full">
            <Heart className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm sm:text-lg truncate">
            {item.media_items?.title || "Unknown"}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.rating && (
              <div className="flex items-center gap-1 text-sm sm:text-base font-bold">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                {item.rating}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 hover:bg-accent rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground">
          {/* Creator */}
          {(item.media_items as any)?.author && (
            <p>Author: {(item.media_items as any).author}</p>
          )}
          {(item.media_items as any)?.artist && (
            <p>Artist: {(item.media_items as any).artist}</p>
          )}

          {/* Type-specific info */}
          {item.media_items?.type === "movie" &&
            (item.media_items as any).year && (
              <p>Year: {(item.media_items as any).year}</p>
            )}
          {item.media_items?.type === "anime" &&
            (item.media_items as any).num_episodes && (
              <p>Episodes: {(item.media_items as any).num_episodes}</p>
            )}
          {item.media_items?.type === "manga" &&
            (item.media_items as any).num_chapters && (
              <p>Chapters: {(item.media_items as any).num_chapters}</p>
            )}

          {/* Progress */}
          {item.progress !== undefined && item.progress_total && (
            <div className="flex items-center gap-2">
              <p>
                Progress: {item.progress} / {item.progress_total} (
                {progressPercentage}%)
              </p>
              <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Status */}
          {item.status && (
            <p className="capitalize">
              Status: {item.status.replace(/_/g, " ")}
            </p>
          )}

          {/* Date added */}
          <p>Added: {formatDate(item.timestamp)}</p>
        </div>

        {/* Genres */}
        {item.media_items?.genre && item.media_items.genre.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.media_items.genre.map((genre, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Compact View Card Component
function MediaCardCompact({
  item,
  index,
  onEdit,
}: {
  item: UserMedia & { media_items: MediaItem | null };
  index: number;
  onEdit: (item: UserMedia & { media_items: MediaItem | null }) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.005, 0.2) }}
      className="group relative aspect-[2/3] rounded overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
      title={`${item.media_items?.title || "Unknown"}${
        item.rating ? ` - ${item.rating}/10` : ""
      }`}
    >
      {item.media_items?.poster_url ? (
        <img
          src={normalizePosterUrl(item.media_items.poster_url) || ""}
          alt={item.media_items.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center text-base sm:text-xl">
          {item.media_items?.type === "book"
            ? "📚"
            : item.media_items?.type === "movie"
            ? "🎬"
            : item.media_items?.type === "music"
            ? "🎵"
            : item.media_items?.type === "anime"
            ? "📺"
            : "📖"}
        </div>
      )}

      {/* Favorite Indicator */}
      {item.is_favorite && (
        <div className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full">
          <Heart className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
        </div>
      )}

      {/* Rating overlay */}
      {item.rating && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1 sm:p-2">
          <div className="flex items-center gap-1 text-white text-xs font-bold">
            <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
            {item.rating}
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {item.progress !== undefined &&
        item.progress_total &&
        item.progress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/50">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${Math.round(
                  (item.progress / item.progress_total) * 100
                )}%`,
              }}
            />
          </div>
        )}

      {/* Edit Button (appears on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm text-white p-1 rounded hover:bg-black"
        title="Edit"
      >
        <Edit2 className="w-2 h-2 sm:w-3 sm:h-3" />
      </button>
    </motion.div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
