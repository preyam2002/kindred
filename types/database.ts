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

export interface UserMedia {
  id: string;
  user_id: string;
  media_type: "book" | "anime" | "manga" | "movie" | "music";
  media_id: string;
  rating?: number;
  timestamp: Date;
  tags?: string[];
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

