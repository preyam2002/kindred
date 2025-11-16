"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, X, Users, Film, BookOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "user" | "media";
  media_type?: string;
  id: string;
  title: string;
  subtitle: string;
  poster_url?: string;
  url: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    users: SearchResult[];
    media: SearchResult[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Search function with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (url: string) => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    router.push(url);
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === "user") {
      return <Users className="w-5 h-5 text-purple-500" />;
    }
    if (result.media_type === "book") {
      return <BookOpen className="w-5 h-5 text-blue-500" />;
    }
    return <Film className="w-5 h-5 text-pink-500" />;
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors w-full max-w-xs"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search...</span>
        <kbd className="ml-auto text-xs bg-background px-2 py-1 rounded border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Search Dialog */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
              <motion.div
                ref={searchRef}
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users, anime, books, movies..."
                    className="flex-1 bg-transparent outline-none text-lg"
                  />
                  {loading && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Search Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {!query || query.length < 2 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Type at least 2 characters to search</p>
                      <p className="text-sm mt-2">Try searching for users or media titles</p>
                    </div>
                  ) : !results ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                      <p>Searching...</p>
                    </div>
                  ) : results.total === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No results found for "{query}"</p>
                      <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Users Section */}
                      {results.users.length > 0 && (
                        <div className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Users
                          </div>
                          <div className="space-y-1">
                            {results.users.map((result) => (
                              <button
                                key={result.id}
                                onClick={() => handleResultClick(result.url)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                              >
                                {getIcon(result)}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate">{result.title}</div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {result.subtitle}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media Section */}
                      {results.media.length > 0 && (
                        <div className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Media
                          </div>
                          <div className="space-y-1">
                            {results.media.map((result) => (
                              <button
                                key={`${result.media_type}-${result.id}`}
                                onClick={() => handleResultClick(result.url)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                              >
                                {result.poster_url ? (
                                  <img
                                    src={result.poster_url}
                                    alt={result.title}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                    {getIcon(result)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate">{result.title}</div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {result.subtitle}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-muted/50 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>Press ESC to close</span>
                  <span>{results && results.total > 0 && `${results.total} results`}</span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
