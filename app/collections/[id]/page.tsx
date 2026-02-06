"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Globe,
  Lock,
  Users,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import type { Collection, CollectionItem } from "@/types/database";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface CollectionItemWithMedia extends CollectionItem {
  media: any;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItemWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchCollection();
    }
  }, [params.id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/collections/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        setItems(data.items || []);
      } else {
        setError("Failed to load collection");
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const res = await fetch(`/api/collections/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading collection..." fullScreen />;
  }

  if (error || !collection) {
    return (
      <ErrorMessage
        title="Failed to load collection"
        message={error || "Collection not found"}
        onRetry={fetchCollection}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back Button */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{collection.title}</h1>
                {collection.is_public ? (
                  <Globe className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                {collection.is_collaborative && (
                  <Users className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              {collection.description && (
                <p className="text-muted-foreground mb-4">
                  {collection.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {collection.item_count || 0} items
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* TODO: Open edit modal */}}
                className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                aria-label="Edit collection"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 border border-destructive/30 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                aria-label="Delete collection"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Add Item Button */}
        <div className="mb-6">
          <button
            onClick={() => {/* TODO: Open add item modal */}}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6">
              Start adding items to your collection
            </p>
            <button
              onClick={() => {/* TODO: Open add item modal */}}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Add First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <CollectionItemCard
                key={item.id}
                item={item}
                onRemove={fetchCollection}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Collection Item Card Component
function CollectionItemCard({
  item,
  onRemove,
}: {
  item: CollectionItemWithMedia;
  onRemove: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Remove this item from the collection?")) return;

    // TODO: Implement remove item API call
    onRemove();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all"
    >
      {/* Poster */}
      <div className="aspect-[2/3] bg-muted relative overflow-hidden">
        {item.media?.poster_url ? (
          <img
            src={item.media.poster_url}
            alt={item.media.title || "Media item"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={handleRemove}
            className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 bg-card">
        <p className="text-sm font-medium line-clamp-2">
          {item.media?.title || "Untitled"}
        </p>
        {item.notes && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {item.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
}
