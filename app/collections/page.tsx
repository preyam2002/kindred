"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Grid3x3,
  List,
  Lock,
  Globe,
  Users,
  Heart,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Collection } from "@/types/database";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      } else {
        setError("Failed to load collections");
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      setError("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading collections..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load collections"
        message={error}
        onRetry={fetchCollections}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Collections</h1>
            <p className="text-muted-foreground">
              Organize your favorite media into custom lists
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Create Collection Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Collection
            </button>
          </div>
        </div>

        {/* Collections Grid/List */}
        {collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Grid3x3 className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first collection to organize your favorite media
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Collection
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onUpdate={fetchCollections}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <CollectionListItem
                key={collection.id}
                collection={collection}
                onUpdate={fetchCollections}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={fetchCollections}
        />
      )}
    </div>
  );
}

// Collection Card Component
function CollectionCard({
  collection,
  onUpdate,
}: {
  collection: Collection;
  onUpdate: () => void;
}) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="group relative p-6 border border-border rounded-lg bg-card hover:shadow-lg transition-all cursor-pointer"
      >
        {/* Cover Image or Placeholder */}
        <div className="aspect-video mb-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
          {collection.cover_image ? (
            <img
              src={collection.cover_image}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Grid3x3 className="w-16 h-16 text-muted-foreground opacity-20" />
          )}
        </div>

        {/* Collection Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Grid3x3 className="w-4 h-4" />
            {collection.item_count || 0} items
          </div>
          {collection.is_collaborative && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Collaborative
            </div>
          )}
          {collection.is_public ? (
            <Globe className="w-4 h-4" title="Public" />
          ) : (
            <Lock className="w-4 h-4" title="Private" />
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// Collection List Item Component
function CollectionListItem({
  collection,
  onUpdate,
}: {
  collection: Collection;
  onUpdate: () => void;
}) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Grid3x3 className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{collection.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {collection.item_count || 0} items
            {collection.is_collaborative && " • Collaborative"}
          </p>
        </div>

        {/* Privacy Badge */}
        <div className="flex-shrink-0">
          {collection.is_public ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              Public
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              Private
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// Create Collection Modal Component
function CreateCollectionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          is_collaborative: isCollaborative,
        }),
      });

      if (res.ok) {
        onCreate();
        onClose();
      }
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-border rounded-lg p-6 max-w-md w-full shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Create Collection</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Favorite Anime"
              required
              maxLength={100}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A curated list of my all-time favorite anime series..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              <div>
                <div className="font-medium text-sm">
                  {isPublic ? "Public" : "Private"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone can view this collection"
                    : "Only you can view this collection"}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create Collection"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
