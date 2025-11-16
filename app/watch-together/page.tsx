"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Users,
  Play,
  Clock,
  Sparkles,
  Heart,
  Calendar,
  ArrowRight,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Collection {
  id: string;
  name: string;
  description?: string;
  is_collaborative: boolean;
  item_count: number;
  follower_count: number;
  created_at: string;
}

export default function WatchTogetherPage() {
  const { data: session, status } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [isCollaborative, setIsCollaborative] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCollections();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/watch-together");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert("Please enter a collection name");
      return;
    }

    try {
      const res = await fetch("/api/watch-together/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDesc,
          is_collaborative: isCollaborative,
          is_public: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCollections([data.collection, ...collections]);
        setShowCreateModal(false);
        setNewCollectionName("");
        setNewCollectionDesc("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      alert("An error occurred. Please try again.");
    }
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-5xl font-bold mb-4 letterpress">
            Watch Together
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create shared watchlists with friends, track what you plan to watch together,
            and never forget that anime everyone recommended!
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="paper-card p-6">
              <Play className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Shared Lists</h3>
              <p className="text-sm text-muted-foreground">
                Create collaborative watchlists with friends
              </p>
            </div>
            <div className="paper-card p-6">
              <Users className="w-8 h-8 text-secondary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Group Planning</h3>
              <p className="text-sm text-muted-foreground">
                Everyone can add suggestions to the list
              </p>
            </div>
            <div className="paper-card p-6">
              <Calendar className="w-8 h-8 text-accent mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                See what you've watched and what's next
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Get Started
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Collaborative Playlists
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Watch Together
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Create shared watchlists with friends. Plan what to watch, track progress,
              and discover together.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New List
          </Button>
        </div>
      </motion.div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Watchlists Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first collaborative watchlist to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Create Watchlist
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/watch-together/${collection.id}`}>
                <div className="paper-card p-6 hover:border-primary/50 transition-all hover:-translate-y-1 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold mb-2 line-clamp-2">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    {collection.is_collaborative && (
                      <div className="flex-shrink-0 ml-2">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{collection.item_count} items</span>
                    </div>
                    {collection.follower_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{collection.follower_count} following</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(collection.created_at).toLocaleDateString()}
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="paper-card p-8 max-w-md w-full"
          >
            <h2 className="font-display text-2xl font-bold mb-6">
              Create Watchlist
            </h2>

            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider font-medium mb-2 block">
                  List Name *
                </label>
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Friday Night Anime"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider font-medium mb-2 block">
                  Description (optional)
                </label>
                <textarea
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  placeholder="What we're watching together..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="collaborative"
                  checked={isCollaborative}
                  onChange={(e) => setIsCollaborative(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="collaborative" className="text-sm">
                  Allow friends to add items (collaborative)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName("");
                  setNewCollectionDesc("");
                }}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
