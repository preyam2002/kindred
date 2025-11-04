"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Users, TrendingUp, Clock, Sparkles, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/logo";

interface DiscoverUser {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  created_at: string;
  similarityScore?: number;
  sharedCount?: number;
}

export default function DiscoverPage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [minSimilarity, setMinSimilarity] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"username" | "similarity" | "recent">(
    "similarity"
  );

  useEffect(() => {
    if (status === "authenticated") {
      setPage(1); // Reset to first page on filter change
      fetchUsers(1);
    }
  }, [status, sortBy, minSimilarity]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (status === "authenticated") {
        setPage(1); // Reset to first page on search
        fetchUsers(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, status]);

  async function fetchUsers(pageNum: number = page) {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        page: pageNum.toString(),
        sort: sortBy,
      });
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      if (minSimilarity > 0) {
        params.append("minSimilarity", minSimilarity.toString());
      }

      const res = await fetch(`/api/users/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
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
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              Discover Users
            </h1>
            <p className="text-muted-foreground">
              Find users with similar tastes and explore new connections
            </p>
          </div>

          {/* Search and Sort */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("similarity")}
                className={`px-4 py-3 rounded-md border border-border transition-colors flex items-center gap-2 ${
                  sortBy === "similarity"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Similarity
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`px-4 py-3 rounded-md border border-border transition-colors flex items-center gap-2 ${
                  sortBy === "recent"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <Clock className="w-4 h-4" />
                Recent
              </button>
              <button
                onClick={() => setSortBy("username")}
                className={`px-4 py-3 rounded-md border border-border transition-colors flex items-center gap-2 ${
                  sortBy === "username"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <Users className="w-4 h-4" />
                Username
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-md border border-border transition-colors flex items-center gap-2 ${
                  showFilters || minSimilarity > 0
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && sortBy === "similarity" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-card border border-border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Minimum Similarity:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minSimilarity}
                  onChange={(e) => setMinSimilarity(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-12 text-right">
                  {minSimilarity}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          {total > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {users.length} of {total} users
            </div>
          )}

          {/* Users Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery
                ? "No users found matching your search"
                : "No users found"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={`/u/${user.username}`}
                    className="block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.username}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          {user.username}
                        </h3>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {user.similarityScore !== undefined && (
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Compatibility
                          </div>
                          <div className="text-xl font-bold text-primary">
                            {user.similarityScore}%
                          </div>
                        </div>
                        {user.sharedCount !== undefined && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              Shared
                            </div>
                            <div className="text-lg font-semibold">
                              {user.sharedCount}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 text-right">
                      <span className="text-sm text-primary group-hover:underline">
                        View Profile →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchUsers(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => fetchUsers(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </main>
  );
}

