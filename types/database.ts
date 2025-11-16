// Database schema types for kindred

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Source {
  id: string;
  user_id: string;
  source_name: "goodreads" | "myanimelist" | "letterboxd" | "spotify";
  source_user_id: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Media type interfaces
export interface Book {
  id: string;
  type: "book";
  source: "goodreads";
  source_item_id: string;
  title: string;
  author?: string;
  isbn?: string;
  genre?: string[];
  poster_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Anime {
  id: string;
  type: "anime";
  source: "myanimelist";
  source_item_id: string;
  title: string;
  genre?: string[];
  poster_url?: string;
  num_episodes?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Manga {
  id: string;
  type: "manga";
  source: "myanimelist";
  source_item_id: string;
  title: string;
  genre?: string[];
  poster_url?: string;
  num_chapters?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Movie {
  id: string;
  type: "movie";
  source: "letterboxd";
  source_item_id: string;
  title: string;
  year?: number;
  genre?: string[];
  poster_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Music {
  id: string;
  type: "music";
  source: "spotify";
  source_item_id: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string[];
  poster_url?: string;
  duration_ms?: number;
  created_at: Date;
  updated_at: Date;
}

export type MediaStatus =
  | "completed"
  | "watching"
  | "reading"
  | "listening"
  | "plan_to_watch"
  | "plan_to_read"
  | "plan_to_listen"
  | "on_hold"
  | "dropped";

export interface UserMedia {
  id: string;
  user_id: string;
  media_type: "book" | "anime" | "manga" | "movie" | "music";
  media_id: string;
  rating?: number;
  timestamp: Date; // Date added to library
  tags?: string[];
  // Enhanced tracking fields
  status?: MediaStatus; // Current status (completed, watching, etc.)
  progress?: number; // Episodes watched, chapters read, etc.
  progress_total?: number; // Total episodes, chapters, etc.
  times_consumed?: number; // For rewatches/rereads
  start_date?: Date; // When user started
  finish_date?: Date; // When user finished
  is_favorite?: boolean; // Favorite flag
  notes?: string; // Personal notes
  source_rating?: string; // Original rating from source
  created_at: Date;
  updated_at: Date;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  similarity_score: number; // 0-100 (MashScore)
  shared_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Recommendation {
  id: string;
  user_id: string;
  media_type: "book" | "anime" | "manga" | "movie" | "music";
  media_id: string;
  reason: string;
  score: number;
  created_at: Date;
}

export type NotificationType =
  | "match"
  | "challenge"
  | "comment"
  | "reply"
  | "streak"
  | "recommendation"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  // Optional metadata
  actor_id?: string; // User who triggered the notification
  actor_username?: string;
  actor_avatar?: string;
}

// Union type for all media items
export type MediaItem = Book | Anime | Manga | Movie | Music;

