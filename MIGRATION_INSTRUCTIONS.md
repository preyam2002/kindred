# Database Migration Instructions

## New Features Requiring Migrations

The following features have been implemented and require database migrations:

1. **Notifications System** - Real-time notifications for user activities
2. **Collections** - User-created collections for organizing media
3. **Recommendation Queue** - Personalized queue with smart sorting
4. **Friend System** - Send/accept friend requests, manage friendships
5. **Activity Feed** - Social feed showing friend activities
6. **Social Voting** - Friends can vote on each other's queue items

## Option 1: Run All Migrations at Once (Recommended)

### Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `scripts/apply-new-migrations.sql`
5. Copy the entire file contents
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify all statements executed successfully

### What Gets Created

**Tables:**
- `notifications` - User notification system
- `collections` - User collections
- `collection_items` - Items within collections
- `queue_items` - User recommendation queue
- `friendships` - Friend relationships
- `activity_feed` - Social activity stream
- `queue_votes` - Social voting on queue items

**Security:**
- Row Level Security (RLS) policies for all tables
- Friendship-based access control
- Privacy controls for collections and activity

**Performance:**
- Indexes on frequently queried columns
- Triggers for automatic count updates
- Optimized query patterns

## Option 2: Run Migrations Individually

If you prefer to run migrations one at a time:

### 1. Notifications System
```sql
-- Copy contents from: lib/db/migrations/create_notifications.sql
```

### 2. Collections, Queue, Friends, Activity
```sql
-- Copy contents from: lib/db/migrations/create_collections_queue_friends_activity.sql
```

### 3. Social Voting
```sql
-- Copy contents from: lib/db/migrations/create_queue_votes.sql
```

## Verification

After running migrations, verify the tables were created:

```sql
-- Check all new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'notifications',
  'collections',
  'collection_items',
  'queue_items',
  'friendships',
  'activity_feed',
  'queue_votes'
);
```

Expected result: 7 rows

## Troubleshooting

### "relation already exists"
This is normal if you've run migrations before. The migrations use `CREATE TABLE IF NOT EXISTS`, so they're safe to re-run.

### "permission denied"
Make sure you're using a service role key or running as a database admin.

### Foreign key violations
Make sure your `users` table exists first. If not, run the base schema migrations first.

## Next Steps

After migrations complete successfully:

1. Restart your Next.js development server
2. Test the new features:
   - `/collections` - Create and manage collections
   - `/queue` - Add items to your queue, try different sort modes
   - `/friends` - Send friend requests
   - `/activity` - View activity feed
   - `/u/[username]/queue` - Vote on friends' queues

## Rollback (if needed)

To remove all new tables:

```sql
DROP TABLE IF EXISTS queue_votes CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS queue_items CASCADE;
DROP TABLE IF EXISTS collection_items CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_collection_item_count();
DROP FUNCTION IF EXISTS get_queue_vote_count(UUID);
```

⚠️ **Warning:** This will delete all data in these tables!
