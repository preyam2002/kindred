# Database Setup Guide

This document outlines all database migrations required for the Kindred application. Run these migrations in Supabase in the order listed below.

## Prerequisites

1. Access to your Supabase project dashboard
2. SQL Editor access in Supabase
3. Navigate to: **Supabase Dashboard > SQL Editor**

## Required Migrations

### 1. Taste Challenges Tables
**File:** `lib/db/migrations/create_taste_challenges.sql`

Creates tables for:
- `taste_challenges` - Stores taste challenge data with items
- Expires challenges after 30 days automatically

**Purpose:** Enables the Taste Challenge feature where users can challenge friends

---

### 2. Challenges & Streaks System
**File:** `lib/db/migrations/create_challenges_streaks.sql`

Creates tables for:
- `user_streaks` - Tracks user streaks, points, and levels
- `challenge_completions` - Records completed challenges

**Purpose:** Enables gamification with daily challenges, streaks, and points

---

### 3. Blind Match System
**File:** `lib/db/migrations/create_blind_match.sql`

Creates tables for:
- `blind_match_swipes` - Records user swipes (like/pass)
- `blind_matches` - Stores matched pairs

**Purpose:** Enables anonymous taste matching like dating apps

---

### 4. Media Comments & Reviews
**File:** `lib/db/migrations/create_media_comments.sql`

Creates tables for:
- `media_comments` - User reviews and thoughts on media items
- `comment_likes` - Tracks likes on comments
- Indexes for performance
- Row Level Security policies

**Purpose:** Enables rich comments and discussions on media pages

**Includes:**
- Spoiler warnings
- Rating system (1-10)
- Like functionality
- User can only have one review per media item (enforced by unique constraint)

---

## Post-Migration Steps

### 1. Verify Tables Were Created

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'taste_challenges',
  'user_streaks',
  'challenge_completions',
  'blind_match_swipes',
  'blind_matches',
  'media_comments',
  'comment_likes'
);
```

You should see 7 tables listed.

### 2. Check Indexes

Run this to verify indexes were created:

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('media_comments', 'comment_likes', 'user_streaks');
```

### 3. Verify RLS Policies

Check that Row Level Security is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('media_comments', 'comment_likes', 'taste_challenges');
```

All should show `rowsecurity = true`.

## Optional: Database Functions

For better performance on comment likes, you can add these functions:

```sql
-- Increment likes count
CREATE OR REPLACE FUNCTION increment_likes(comment_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE media_comments
  SET likes_count = likes_count + 1
  WHERE id = comment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes(comment_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE media_comments
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = comment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Troubleshooting

### Error: "relation already exists"
This means the table was already created. You can safely skip that migration or drop the table first:
```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

### Error: "permission denied"
Ensure you're running the SQL as a Supabase admin user with sufficient privileges.

### Error: "auth.uid() does not exist"
This occurs if you haven't set up Supabase Auth properly. The RLS policies use `auth.uid()` which requires Supabase Auth to be configured.

## Feature-to-Table Mapping

| Feature | Tables Used |
|---------|-------------|
| Taste Challenge | `taste_challenges` |
| Year Wrapped | `user_media`, `taste_profiles` (existing) |
| Watch Together | `watch_collections`, `collection_items` (may need creation) |
| Challenges & Streaks | `user_streaks`, `challenge_completions` |
| Blind Match | `blind_match_swipes`, `blind_matches` |
| Taste DNA Art | `taste_profiles` (existing) |
| Taste Twins | `matches`, `library` (existing) |
| Recommendation Roulette | `library`, `taste_profiles` (existing) |
| Share Cards | `taste_profiles`, `user_streaks`, `user_media` (existing) |
| Social Feed | `user_media`, `matches` (existing) |
| Leaderboards | `user_streaks`, `taste_profiles`, `user_media` (existing) |
| Media Comments | `media_comments`, `comment_likes` |

## Next Steps After Migration

1. **Test each feature** to ensure database operations work correctly
2. **Check for missing indexes** if queries are slow
3. **Monitor database performance** in Supabase dashboard
4. **Set up database backups** (automatic in Supabase Pro)
5. **Configure RLS policies** for any custom tables you create

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Verify RLS policies aren't blocking legitimate operations
3. Ensure auth tokens are being sent correctly from the frontend
4. Check that user IDs match between your auth system and database

---

**Last Updated:** 2025-11-16
**Application Version:** 1.0.0
