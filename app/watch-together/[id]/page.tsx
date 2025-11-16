"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Users,
  ArrowLeft,
  Search,
  Check,
  Trash2,
  Heart,
  Star,
  BookOpen,
  Film,
  Music,
  Tv,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { normalizePosterUrl } from "@/lib/utils";

interface CollectionItem {
  id: string;
  media_id: string;
  media_type: string;
  title: string;
  poster_url?: string;
  author?: string;
  artist?: string;
  genre?: string[];
  notes?: string;
  sort_order: number;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  is_collaborative: boolean;
  is_public: boolean;
  item_count: number;
  follower_count: number;
  items: CollectionItem[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/watch-together/${collectionId}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data);
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchMedia = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearching(false);
    }
  };

  const addToCollection = async (mediaId: string, mediaType: string) => {
    try {
      const res = await fetch(`/api/watch-together/${collectionId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: mediaId, media_type: mediaType }),
      });

      if (res.ok) {
        fetchCollection();
        setShowAddModal(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error adding to collection:", error);
    }
  };

  const removeFromCollection = async (itemId: string) => {
    if (!confirm("Remove this item from the collection?")) return;

    try {
      const res = await fetch(`/api/watch-together/${collectionId}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (res.ok) {
        fetchCollection();
      }
    } catch (error) {
      console.error("Error removing from collection:", error);
    }
  };

  const getMediaIcon = (type: string) => {
    const icons: Record<string, any> = {
      book: BookOpen,
      anime: Tv,
      manga: BookOpen,
      movie: Film,
      music: Music,
    };
    return icons[type] || Film;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <Link
            href="/watch-together"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Watchlists
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
        <Link
          href="/watch-together"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Watchlists
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                {collection.name}
              </h1>
              {collection.is_collaborative && (
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Collaborative
                </div>
              )}
            </div>
            {collection.description && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>{collection.item_count} items</span>
              {collection.follower_count > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {collection.follower_count} following
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </motion.div>

      {/* Items Grid */}
      {collection.items.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Items Yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your first item to this watchlist
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {collection.items.map((item, index) => {
            const Icon = getMediaIcon(item.media_type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="paper-card overflow-hidden hover:border-primary/50 transition-all">
                  {/* Poster */}
                  {item.poster_url ? (
                    <div className="relative aspect-[2/3] bg-muted">
                      <img
                        src={normalizePosterUrl(item.poster_url) || ""}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCollection(item.id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-[2/3] bg-muted flex items-center justify-center">
                      <Icon className="w-12 h-12 text-muted-foreground opacity-50" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Icon className="w-3 h-3 text-primary" />
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.media_type}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {item.title}
                    </h3>

                    {(item.author || item.artist) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.author || item.artist}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="paper-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <h2 className="font-display text-2xl font-bold mb-6">
              Add to Watchlist
            </h2>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchMedia(e.target.value);
                  }}
                  placeholder="Search anime, manga, books, movies..."
                  className="pl-10"
                />
              </div>
            </div>

            {searching && (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 mb-6">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => addToCollection(result.id, result.type)}
                    className="w-full flex items-center gap-4 p-3 border border-border rounded-md hover:bg-accent transition-colors text-left"
                  >
                    {result.poster_url ? (
                      <img
                        src={normalizePosterUrl(result.poster_url) || ""}
                        alt={result.title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                        {getMediaIcon(result.type)({ className: "w-6 h-6 text-muted-foreground" })}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{result.title}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {result.type}
                        {(result.author || result.artist) &&
                          ` • ${result.author || result.artist}`}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
