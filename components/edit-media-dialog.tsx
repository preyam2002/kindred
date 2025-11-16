"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Star, Loader2 } from "lucide-react";
import type { UserMedia, MediaItem } from "@/types/database";

interface EditMediaDialogProps {
  item: UserMedia & { media_items: MediaItem | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditMediaDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
}: EditMediaDialogProps) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(item.status || "");
  const [progress, setProgress] = useState(item.progress || 0);
  const [progressTotal, setProgressTotal] = useState(item.progress_total || 0);
  const [isFavorite, setIsFavorite] = useState(item.is_favorite || false);
  const [rating, setRating] = useState(item.rating || 0);

  const handleSave = async () => {
    setSaving(true);

    try {
      // Update status
      if (status !== item.status) {
        await fetch(`/api/library/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      }

      // Update progress
      if (progress !== item.progress || progressTotal !== item.progress_total) {
        await fetch(`/api/library/${item.id}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress, progress_total: progressTotal }),
        });
      }

      // Update favorite
      if (isFavorite !== item.is_favorite) {
        await fetch(`/api/library/${item.id}/favorite`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_favorite: isFavorite }),
        });
      }

      // Update rating
      if (rating !== item.rating) {
        await fetch(`/api/library/${item.id}/rating`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: rating || null }),
        });
      }

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating media:", error);
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "", label: "No Status" },
    { value: "completed", label: "Completed" },
    { value: "watching", label: "Watching" },
    { value: "reading", label: "Reading" },
    { value: "listening", label: "Listening" },
    { value: "plan_to_watch", label: "Plan to Watch" },
    { value: "plan_to_read", label: "Plan to Read" },
    { value: "plan_to_listen", label: "Plan to Listen" },
    { value: "on_hold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {item.media_items?.title || "Media"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progress */}
          <div>
            <label className="text-sm font-medium mb-2 block">Progress</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                placeholder="Current"
                className="flex-1"
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                min="0"
                value={progressTotal}
                onChange={(e) =>
                  setProgressTotal(parseInt(e.target.value) || 0)
                }
                placeholder="Total"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.media_type === "anime"
                ? "Episodes"
                : item.media_type === "manga"
                ? "Chapters"
                : item.media_type === "book"
                ? "Pages"
                : "Items"}
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Rating: {rating > 0 ? rating : "Not rated"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-center flex items-center justify-center gap-1">
                {rating > 0 && (
                  <>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-bold">{rating}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Favorite */}
          <div className="flex items-center justify-between p-3 border border-border rounded-md">
            <div className="flex items-center gap-2">
              <Heart
                className={`w-5 h-5 ${
                  isFavorite
                    ? "text-red-500 fill-current"
                    : "text-muted-foreground"
                }`}
              />
              <label className="text-sm font-medium cursor-pointer">
                Mark as Favorite
              </label>
            </div>
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
