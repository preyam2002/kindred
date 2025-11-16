# Kindred Setup Instructions

## Required Dependencies

### Install Cheerio for Web Scraping

```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

This is required for the Goodreads and Letterboxd scrapers to work.

## Database Migrations

Run these migrations in order in your Supabase SQL Editor:

1. `lib/db/migrations/add_conversations_and_messages.sql` - AI chat feature
2. `lib/db/migrations/add_viral_tracking.sql` - Viral sharing and referrals
3. `lib/db/migrations/add_waitlist.sql` - Waitlist system

## Environment Variables

Make sure you have these set in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_key

# NextAuth
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=your_secret_key

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# MyAnimeList API (optional)
MAL_CLIENT_ID=your_mal_client_id
MAL_CLIENT_SECRET=your_mal_client_secret

# Spotify API (optional)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Features Implemented

### 1. AI Conversational Assistant (/chat)

- Chat with AI about your media taste
- Persistent conversation history
- Context-aware responses based on your library

### 2. Viral Sharing Engine

- Share compatibility matches on social media
- Track shares, clicks, and conversions
- Viral coefficient (K-factor) measurement
- Analytics dashboard at /analytics

### 3. Waitlist System (/waitlist)

- Referral-based queue jumping
- Admin dashboard at /waitlist/admin
- Public leaderboard at /waitlist/leaderboard
- Gamification to drive signups

### 4. Web Scrapers (NEW!)

- Goodreads: Public profile scraping (no auth needed)
- Letterboxd: Public profile scraping (no auth needed)
- APIs: GET /api/scrape/goodreads?username=X
- APIs: GET /api/scrape/letterboxd?username=X

## Next Steps

1. Install cheerio: `npm install cheerio @types/cheerio`
2. Run database migrations in Supabase
3. Set up environment variables
4. Run `npm run dev`
5. Test scrapers at `/api/scrape/goodreads?username=example`

## Upcoming Features

- [ ] Demo swipe mode (no signup required)
- [ ] Enhanced media metadata (images, summaries, audio)
- [ ] MAL/Spotify API simplification
- [ ] Public profile preview (instant value)
