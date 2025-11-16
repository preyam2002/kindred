# End-to-End Testing Guide for Kindred

This guide walks you through testing the entire Kindred application from setup to full functionality.

---

## 📋 Prerequisites

### Required:
- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn package manager

### Optional (for full testing):
- Google OAuth credentials
- Twitter/X OAuth credentials
- MyAnimeList API credentials
- Spotify API credentials

---

## 🚀 Step 1: Initial Setup

### 1.1 Install Dependencies
```bash
cd /home/user/kindred
npm install
```

**Expected Result**: All dependencies install without errors (canvas removed, so no native dependency issues)

### 1.2 Environment Configuration
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

**Minimum Required Variables:**
```env
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:5001
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project to initialize (~2 minutes)
4. Copy project URL and anon key to `.env.local`

### 2.2 Run Base Schema
1. Open Supabase SQL Editor
2. Copy contents of `lib/db/schema.sql`
3. Run the SQL

**Expected Result**:
- 12 tables created (users, sources, books, anime, manga, movies, music, user_media, matches, recommendations, waitlist, etc.)
- All triggers and functions created
- All indexes created

### 2.3 Run Migration (Enhanced Tracking Fields)
1. Open Supabase SQL Editor
2. Copy contents of `lib/db/migrations/add_user_media_tracking_fields.sql`
3. Run the SQL

**Expected Result**:
- user_media table now has additional columns:
  - status
  - progress
  - progress_total
  - times_consumed
  - start_date
  - finish_date
  - is_favorite
  - notes
  - source_rating
- New indexes created
- Column comments added

### 2.4 Verify Database Structure
Run this query to verify:
```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_media'
ORDER BY ordinal_position;
```

**Expected Result**: See all columns including new tracking fields

---

## 🧪 Step 3: TypeScript Compilation Check

### 3.1 Run Type Check
```bash
npx tsc --noEmit
```

**Expected Result**: No TypeScript errors ✅

### 3.2 Verify Types
Check that types are updated:
```bash
grep -A 20 "export interface UserMedia" types/database.ts
```

**Expected Result**: Should show new fields (status, progress, is_favorite, etc.)

---

## 🏃 Step 4: Run Development Server

### 4.1 Start Server
```bash
npm run dev
```

**Expected Result**:
```
> kindred@0.1.0 dev
> next dev -p 5001

  ▲ Next.js 16.0.1
  - Local:        http://localhost:5001
  - Network:      http://<your-ip>:5001

✓ Ready in X seconds
```

### 4.2 Access Application
Open browser to: `http://localhost:5001`

**Expected Result**: Landing page loads with:
- Navigation bar
- Hero section
- Call-to-action buttons

---

## 🔐 Step 5: Authentication Testing

### 5.1 Test Sign Up (Email)
1. Click "Get Started"
2. Navigate to sign up page
3. Enter email and password (if email auth is implemented)

**Expected Result**:
- User account created in Supabase
- User redirected to dashboard

### 5.2 Test Google OAuth (if configured)
1. Go to login page
2. Click "Sign in with Google"
3. Complete Google auth flow

**Expected Result**:
- User created in database
- Username auto-generated from email
- Avatar synced from Google
- Redirected to dashboard

### 5.3 Test Twitter OAuth (if configured)
1. Go to login page
2. Click "Sign in with Twitter"
3. Complete Twitter auth flow

**Expected Result**:
- User created in database
- Avatar synced from Twitter
- Redirected to dashboard

### 5.4 Verify User in Database
```sql
SELECT id, username, email, avatar, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**: See your newly created user(s)

---

## 📚 Step 6: Integration Testing

### 6.1 Goodreads CSV Import
1. Log in to Goodreads
2. Export library: `https://www.goodreads.com/review/import`
3. Download CSV file
4. In Kindred: Go to Settings → Integrations
5. Click "Connect Goodreads"
6. Upload CSV file

**Expected Result**:
- Books imported and visible in database
- Source created with source_name='goodreads'
- user_media records created linking user to books
- Ratings converted (5-star → 10-point scale)

**Verify:**
```sql
SELECT COUNT(*) FROM books;
SELECT COUNT(*) FROM user_media WHERE media_type = 'book';
SELECT COUNT(*) FROM sources WHERE source_name = 'goodreads';
```

### 6.2 Letterboxd CSV Import
1. Log in to Letterboxd
2. Export data: `https://letterboxd.com/settings/data/`
3. Download and extract ZIP
4. In Kindred: Go to Settings → Integrations
5. Click "Connect Letterboxd"
6. Upload `watched.csv` or `ratings.csv`

**Expected Result**:
- Movies imported
- Ratings converted to 10-point scale
- Watch dates preserved

**Verify:**
```sql
SELECT COUNT(*) FROM movies;
SELECT COUNT(*) FROM user_media WHERE media_type = 'movie';
```

### 6.3 MyAnimeList OAuth (if configured)
1. Register app at `https://myanimelist.net/apiconfig`
2. Add credentials to `.env.local`:
   ```env
   MYANIMELIST_CLIENT_ID=your_client_id
   MYANIMELIST_CLIENT_SECRET=your_client_secret
   ```
3. Restart dev server
4. Go to Settings → Integrations
5. Click "Connect MyAnimeList"
6. Authorize on MAL website

**Expected Result**:
- OAuth tokens stored in sources table
- Anime list automatically synced
- Manga list automatically synced
- Ratings preserved (1-10 scale)

**Verify:**
```sql
SELECT COUNT(*) FROM anime;
SELECT COUNT(*) FROM manga;
SELECT COUNT(*) FROM user_media WHERE media_type IN ('anime', 'manga');
```

### 6.4 Spotify OAuth (if configured)
1. Register app at `https://developer.spotify.com/dashboard`
2. Add redirect URI: `http://localhost:5001/api/integrations/spotify/callback`
3. Add credentials to `.env.local`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
4. Restart dev server
5. Go to Settings → Integrations
6. Click "Connect Spotify"
7. Authorize on Spotify

**Expected Result**:
- OAuth tokens stored
- Saved tracks imported
- Top tracks imported
- Artist names stored as genres

**Verify:**
```sql
SELECT COUNT(*) FROM music;
SELECT COUNT(*) FROM user_media WHERE media_type = 'music';
```

---

## 📖 Step 7: Library Page Testing

### 7.1 Access Library
1. Navigate to `/library`
2. Verify page loads

**Expected Result**:
- See all imported media
- Filter buttons show counts
- Stats summary displays correctly

### 7.2 Test Type Filtering
1. Click "Books" filter
2. Click "Movies" filter
3. Click "Anime" filter
4. Click "Music" filter
5. Click "All" filter

**Expected Result**:
- Grid updates instantly
- Only selected type shown
- URL updates with `?type=book`, etc.

### 7.3 Test Search
1. Enter title in search box
2. Verify real-time filtering

**Expected Result**:
- Results filter as you type
- Shows matching titles
- Shows matching authors/artists

### 7.4 Test Sorting
1. Sort by "Highest Rated"
2. Sort by "Lowest Rated"
3. Sort by "Newest First"
4. Sort by "Oldest First"
5. Sort by "Title (A-Z)"

**Expected Result**:
- Grid reorders instantly
- Correct sort order maintained

### 7.5 Test View Modes (when implemented)
1. Click Grid view icon
2. Click List view icon
3. Click Compact view icon

**Expected Result**:
- Layout changes appropriately
- Data preserved across views

### 7.6 Test Rating Filter (when implemented)
1. Open advanced filters
2. Adjust rating range sliders
3. Verify filtered results

**Expected Result**:
- Only items in rating range shown
- Count updates dynamically

---

## 🎯 Step 8: Matching Engine Testing

### 8.1 Create Second User
1. Open incognito window
2. Create second user account
3. Import some overlapping media

### 8.2 Calculate Match
1. As User 1, navigate to `/username2` (User 2's username)
2. Or use mash URL: `/user1/user2`

**Expected Result**:
- MashScore calculated (0-100)
- Shared items displayed
- Recommendations shown
- Match stored in database

**Verify:**
```sql
SELECT * FROM matches
WHERE user1_id = '<user1-id>' OR user2_id = '<user1-id>';
```

### 8.3 Test Match Caching
1. Refresh the mash page
2. Should load from cache

**Expected Result**:
- Faster load time (< 100ms)
- No recalculation unless media updated recently

---

## 📊 Step 9: Dashboard Testing

### 9.1 Access Dashboard
Navigate to `/dashboard`

**Expected Result**:
- Stats displayed (total media, ratings, etc.)
- Recent matches shown
- Suggested matches shown
- Recent activity timeline
- Connected integrations list

### 9.2 Verify Stats Accuracy
Compare dashboard stats with database:

```sql
-- Total media count
SELECT COUNT(*) FROM user_media WHERE user_id = '<your-user-id>';

-- Average rating
SELECT AVG(rating) FROM user_media
WHERE user_id = '<your-user-id>' AND rating IS NOT NULL;

-- Media by type
SELECT media_type, COUNT(*)
FROM user_media
WHERE user_id = '<your-user-id>'
GROUP BY media_type;
```

**Expected Result**: Dashboard stats match database queries

---

## 🔍 Step 10: Recommendations Testing

### 10.1 Access Recommendations API
```bash
curl http://localhost:5001/api/recommendations
```

**Expected Result**:
- Returns array of recommendations
- Each has: media, reason, score, source
- Sources: "collaborative", "content", "similar_users"

### 10.2 Verify Recommendations
```sql
-- Check stored recommendations
SELECT * FROM recommendations
WHERE user_id = '<your-user-id>'
ORDER BY score DESC;
```

---

## 🧩 Step 11: Additional Feature Testing

### 11.1 Test Search/Discovery
1. Navigate to `/discover`
2. Search for users by username
3. Filter by media type

**Expected Result**:
- User search works
- Filters apply correctly
- Can navigate to user profiles

### 11.2 Test Chat Feature (if AI keys configured)
1. Navigate to `/chat`
2. Ask a question about your library
3. Verify AI responds with context

**Expected Result**:
- Chat interface loads
- AI has context of your media
- Responses are relevant

### 11.3 Test Waitlist (if needed)
1. Navigate to `/waitlist`
2. Enter email and name
3. Get referral code

**Expected Result**:
- Entry added to waitlist table
- Unique referral code generated
- Position assigned

---

## 🐛 Step 12: Error Handling Testing

### 12.1 Test Invalid Routes
1. Navigate to `/nonexistent-page`

**Expected Result**: 404 page or redirect

### 12.2 Test Unauthorized Access
1. Log out
2. Try to access `/dashboard`

**Expected Result**: Redirect to login

### 12.3 Test Invalid Media Upload
1. Try uploading non-CSV file to Goodreads
2. Try uploading corrupted CSV

**Expected Result**:
- Error message displayed
- No database corruption
- User can retry

---

## ⚡ Step 13: Performance Testing

### 13.1 Large Library Performance
Add test data:
```sql
-- Generate 1000 test books (adjust as needed)
-- Note: This is a sample query, adjust IDs as needed
INSERT INTO books (source, source_item_id, title, author, genre)
SELECT
  'goodreads',
  'test-' || generate_series,
  'Test Book ' || generate_series,
  'Test Author ' || (generate_series % 50),
  ARRAY['Fiction', 'Test']
FROM generate_series(1, 1000);

-- Link to user
INSERT INTO user_media (user_id, media_type, media_id, rating, timestamp)
SELECT
  '<your-user-id>',
  'book',
  id,
  (random() * 10)::integer + 1,
  NOW() - (random() * 365 || ' days')::interval
FROM books
WHERE source_item_id LIKE 'test-%';
```

**Test Performance:**
1. Navigate to `/library`
2. Measure page load time
3. Test search responsiveness
4. Test filter performance

**Expected Result**:
- Initial load < 2 seconds
- Search updates < 100ms
- Filter updates < 100ms
- Smooth scrolling

### 13.2 Match Calculation Performance
With large libraries:
1. Calculate match between two users with 500+ items each
2. Measure time

**Expected Result**:
- First calculation: < 3 seconds
- Cached retrieval: < 100ms

---

## 📸 Step 14: Visual Testing

### 14.1 Responsive Design
Test on different screen sizes:
- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)
- Ultra-wide (2560px)

**Expected Result**:
- Layout adapts appropriately
- No horizontal scroll
- Touch targets adequate on mobile
- Readable text at all sizes

### 14.2 Dark Mode (if implemented)
Toggle dark mode

**Expected Result**:
- All components update colors
- No contrast issues
- Images display correctly

---

## ✅ Step 15: Final Checklist

### Core Functionality:
- [ ] User signup/login works
- [ ] Google OAuth works (if configured)
- [ ] Twitter OAuth works (if configured)
- [ ] Goodreads CSV import works
- [ ] Letterboxd CSV import works
- [ ] MyAnimeList sync works (if configured)
- [ ] Spotify sync works (if configured)

### Library Features:
- [ ] Library page loads all media
- [ ] Type filters work
- [ ] Search works
- [ ] Sort options work
- [ ] View modes work (when implemented)
- [ ] Stats are accurate

### Matching:
- [ ] Can view other user profiles
- [ ] MashScore calculates correctly
- [ ] Shared items display
- [ ] Recommendations generate
- [ ] Cache works (24-hour)

### Performance:
- [ ] Page loads < 3 seconds
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth animations

### Database:
- [ ] All tables created
- [ ] Migrations applied
- [ ] Indexes working
- [ ] No orphaned records

---

## 🔧 Troubleshooting

### Issue: Dependencies won't install
**Solution**: Make sure Node 18+ is installed. Run `node --version`.

### Issue: TypeScript errors
**Solution**: Run `npm run build` to see specific errors. All should be fixed now.

### Issue: Database connection fails
**Solution**:
- Check Supabase URL and anon key in `.env.local`
- Verify Supabase project is not paused
- Check network connectivity

### Issue: OAuth redirect fails
**Solution**:
- Verify redirect URIs in OAuth provider settings
- Check `NEXTAUTH_URL` in `.env.local`
- Ensure `trustHost: true` in auth config

### Issue: Build fails with font errors
**Solution**: This is a known issue in restricted network environments. The app will work in development mode and production with internet access.

### Issue: Matching engine returns no results
**Solution**:
- Verify both users have media in database
- Check that media has proper `media_type` and `media_id` fields
- Run recommendations migration if using old schema

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **NextAuth Docs**: https://next-auth.js.org/

---

## 🎉 Success Criteria

You've successfully completed E2E testing when:

✅ All 4 integrations can import data
✅ Library displays all media types correctly
✅ Matching engine calculates scores
✅ Recommendations generate
✅ Search and filters work
✅ No TypeScript errors
✅ No console errors
✅ Performance is acceptable
✅ Database migrations applied

**Congratulations! Kindred is working end-to-end!** 🎊
