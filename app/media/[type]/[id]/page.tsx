"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Star,
  Heart,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  rating: number | null;
  is_spoiler: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

interface MediaItem {
  id: string;
  title: string;
  cover_image?: string;
  poster_url?: string;
  genre?: string[];
  description?: string;
  author?: string;
  artist?: string;
  year?: number;
  status?: string;
}

export default function MediaDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const mediaType = params.type as string;
  const mediaId = params.id as string;

  const [media, setMedia] = useState<MediaItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState<number | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [socialProof, setSocialProof] = useState<any>(null);

  useEffect(() => {
    if (mediaId && mediaType) {
      loadMediaAndComments();
      loadSocialProof();
    }
  }, [mediaId, mediaType]);

  const loadMediaAndComments = async () => {
    setLoading(true);
    try {
      // Fetch media details
      const mediaRes = await fetch(`/api/media/${mediaType}/${mediaId}`);
      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setMedia(data.media);
      }

      // Fetch comments
      const commentsRes = await fetch(
        `/api/comments?mediaId=${mediaId}&mediaType=${mediaType}`
      );
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSocialProof = async () => {
    try {
      const res = await fetch(`/api/social-proof/item?mediaId=${mediaId}`);
      if (res.ok) {
        const data = await res.json();
        setSocialProof(data);
      }
    } catch (error) {
      console.error("Error loading social proof:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_id: mediaId,
          media_type: mediaType,
          content: newComment,
          rating: newRating,
          is_spoiler: isSpoiler,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add or update comment in list
        const existingIndex = comments.findIndex(
          (c) => c.user_id === session.user?.id
        );

        if (existingIndex >= 0) {
          const updated = [...comments];
          updated[existingIndex] = data.comment;
          setComments(updated);
        } else {
          setComments([data.comment, ...comments]);
        }

        setNewComment("");
        setNewRating(null);
        setIsSpoiler(false);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this review?")) return;

    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session) return;

    try {
      const res = await fetch("/api/comments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(
          comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likes_count: data.liked ? c.likes_count + 1 : c.likes_count - 1,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Media not found</p>
          <Link
            href="/discover"
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const userComment = comments.find((c) => c.user_id === session?.user?.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cover Image */}
            {(media.cover_image || media.poster_url) && (
              <div className="md:col-span-1">
                <div className="aspect-[2/3] relative bg-muted rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src={media.cover_image || media.poster_url}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Info */}
            <div className="md:col-span-2">
              <div className="mb-2 text-sm text-muted-foreground uppercase">
                {mediaType}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {media.title}
              </h1>

              {media.author && (
                <p className="text-lg text-muted-foreground mb-4">
                  by {media.author}
                </p>
              )}
              {media.artist && (
                <p className="text-lg text-muted-foreground mb-4">
                  by {media.artist}
                </p>
              )}
              {media.year && (
                <p className="text-muted-foreground mb-4">({media.year})</p>
              )}

              {media.genre && media.genre.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {media.genre.map((g, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {media.description && (
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {media.description}
                </p>
              )}

              {/* Social Proof */}
              {socialProof && socialProof.friend_count > 0 && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold">
                        {socialProof.friend_count} friend{socialProof.friend_count !== 1 ? "s" : ""}{" "}
                        rated this
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Average rating: {socialProof.avg_rating}/10
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">
              Reviews & Thoughts ({comments.length})
            </h2>
          </div>

          {/* Comment Form */}
          {session ? (
            <form onSubmit={handleSubmitComment} className="paper-card p-6 mb-8">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  {userComment ? "Update your review" : "Share your thoughts"}
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What did you think of this? (Required)"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Your Rating (Optional)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewRating(rating)}
                        className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                          newRating === rating
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-accent"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpoiler}
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Contains spoilers</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Posting..."
                  : userComment
                  ? "Update Review"
                  : "Post Review"}
              </button>
            </form>
          ) : (
            <div className="paper-card p-8 text-center mb-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Sign in to share your thoughts
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="paper-card p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold">{comment.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {comment.rating && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{comment.rating}/10</span>
                      </div>
                    )}

                    {comment.user_id === session?.user?.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-2 hover:bg-accent rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {comment.is_spoiler && !showSpoilers ? (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-600 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-semibold">Spoiler Warning</span>
                    </div>
                    <button
                      onClick={() => setShowSpoilers(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Click to reveal
                    </button>
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed mb-4">
                    {comment.content}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={!session}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:cursor-not-allowed"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes_count}</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {comments.length === 0 && (
              <div className="paper-card p-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
