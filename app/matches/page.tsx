"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Sparkles, TrendingUp, Filter, ChevronLeft, ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/logo";

interface Match {
  id: string;
  similarity_score: number;
  shared_count: number;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
}

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMatches(1);
    }
  }, [status, minScore]);

  async function fetchMatches(pageNum: number = page) {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        page: pageNum.toString(),
      });
      if (minScore > 0) {
        params.append("minScore", minScore.toString());
      }

      const res = await fetch(`/api/matches?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
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
              <TrendingUp className="w-8 h-8 text-primary" />
              Your Matches
            </h1>
            <p className="text-muted-foreground">
              Browse all your compatibility matches sorted by MashScore
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-md border border-border transition-colors flex items-center gap-2 ${
                showFilters || minScore > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {total > 0 && (
              <div className="text-sm text-muted-foreground">
                {total} match{total !== 1 ? "es" : ""} found
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-card border border-border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Minimum MashScore:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => {
                    setMinScore(parseInt(e.target.value));
                    setPage(1);
                  }}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-16 text-right">
                  {minScore}%
                </span>
              </div>
            </motion.div>
          )}

          {/* Matches Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading matches...
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No matches yet</p>
              <p className="text-sm mb-4">
                Connect integrations and discover users to find your kindred spirits
              </p>
              <Link
                href="/discover"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                Discover Users
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={session?.user?.username 
                      ? `/${session.user.username}/${match.otherUser.username}` 
                      : `/u/${match.otherUser.username}`}
                    className="block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {match.otherUser.avatar ? (
                          <Image
                            src={match.otherUser.avatar}
                            alt={match.otherUser.username}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                            {match.otherUser.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          @{match.otherUser.username}
                        </h3>
                        {match.otherUser.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {match.otherUser.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          MashScore
                        </div>
                        <div className="text-3xl font-bold text-primary">
                          {match.similarity_score}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Shared Items
                        </div>
                        <div className="text-lg font-semibold">
                          {match.shared_count}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-right">
                      <span className="text-sm text-primary group-hover:underline">
                        View Comparison →
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
                onClick={() => fetchMatches(page - 1)}
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
                onClick={() => fetchMatches(page + 1)}
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


