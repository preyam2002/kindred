# kindred

A social platform that aggregates your tracked activity from Goodreads, MyAnimeList, Letterboxd, and Spotify to connect you with people who share your tastes.

## Features

- **Authentication**: OAuth (Google) and email-based sign-in
- **Profile Pages**: View user profiles at `/u/[username]` with their tracked media
- **Mash-Up**: Compare two users at `/mash/[user1]-[user2]` with MashScore calculation
- **Integrations**: Connect external platforms (placeholder for MVP)
- **Matching Engine**: Calculate similarity scores based on overlapping tastes

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd kindred
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: For Google OAuth (optional)
- `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`: For X (Twitter) OAuth (optional)
- `MYANIMELIST_CLIENT_ID` and `MYANIMELIST_CLIENT_SECRET`: For MyAnimeList OAuth (get from https://myanimelist.net/apiconfig)
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`: For Spotify OAuth (get from https://developer.spotify.com/dashboard)

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL from `lib/db/schema.sql` in your Supabase SQL editor

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
kindred/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── mash/             # Mash-up comparison pages
│   ├── u/                # User profile pages
│   ├── settings/         # Settings and integrations
│   └── page.tsx          # Landing page
├── components/           # React components
├── lib/
│   ├── db/              # Database utilities
│   └── matching.ts      # Matching engine
├── types/               # TypeScript types
└── public/             # Static assets
```

## Color Scheme

The design uses a minimalist black, pink, and purple color scheme:
- **Background**: Black (`oklch(0 0 0)`)
- **Primary**: Purple (`oklch(0.5 0.25 330)`)
- **Secondary**: Pink (`oklch(0.65 0.25 340)`)

## MVP Status

This is an MVP with the following implemented:
- ✅ Authentication (email + Google OAuth)
- ✅ Landing page with animations
- ✅ User profile pages
- ✅ Mash-up comparison pages
- ✅ Matching engine
- ✅ Database schema
- ✅ Goodreads CSV import integration
- ✅ Letterboxd CSV import integration
- ✅ MyAnimeList OAuth integration with automatic syncing
- ✅ X (Twitter) authentication
- ✅ Spotify OAuth integration with automatic syncing

## Integrations

### Goodreads ✅

Since Goodreads no longer supports API keys, the integration uses CSV import:

1. Users export their Goodreads library as CSV from https://www.goodreads.com/review/import
2. Users upload the CSV file in Settings
3. The system parses and imports all books, ratings, and reading dates
4. Users can re-upload updated CSV files to sync new data

**Features:**
- Imports book titles, authors, ISBNs
- Preserves ratings (Goodreads 0-5 star scale converted to 1-10)
- Stores reading dates (Date Read or Date Added)
- Captures bookshelf tags
- Optional Goodreads profile URL for linking

**Note**: This is a manual import process. Users need to export and upload their CSV whenever they want to update their reading data.

### Letterboxd ✅

Similar to Goodreads, Letterboxd integration uses CSV import:

1. Users export their Letterboxd data as CSV from https://letterboxd.com/import/
2. Users upload the CSV file in Settings
3. The system parses and imports all films, ratings, and watch dates
4. Users can re-upload updated CSV files to sync new data

**Features:**
- Imports film titles, years, ratings (0.5-5 stars converted to 1-10 scale)
- Stores watch dates (WatchedDate or DiaryDate)
- Captures tags
- Optional Letterboxd profile URL for linking

**Note**: This is a manual import process. Users need to export and upload their CSV whenever they want to update their film data.

### MyAnimeList ✅

MyAnimeList uses OAuth 2.0 with PKCE for authentication:

1. Register your application at https://myanimelist.net/apiconfig
2. Add credentials to `.env.local`:
   ```
   MYANIMELIST_CLIENT_ID=your_client_id
   MYANIMELIST_CLIENT_SECRET=your_client_secret
   ```
3. Users can connect their MAL account in Settings
4. Anime and manga lists are automatically synced after connection
5. Manual sync is available via the "Sync" button

**Features:**
- Imports anime and manga with ratings (1-10 scale)
- Stores watch/read dates
- Captures list status (watching, completed, on hold, etc.)
- Includes cover images and genres

### Spotify ✅

Spotify uses OAuth 2.0 Authorization Code Flow:

1. Register your application at https://developer.spotify.com/dashboard
2. Add redirect URI: `http://localhost:3000/api/integrations/spotify/callback` (or your production URL)
3. Add credentials to `.env.local`:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
4. Users can connect their Spotify account in Settings
5. Saved tracks and top tracks are automatically synced after connection
6. Manual sync is available via the "Sync" button

**Features:**
- Imports saved tracks (from library)
- Imports top tracks (user's most played)
- Stores album art/poster URLs
- Captures artist names as genre tags
- Automatic token refresh

**Note**: Spotify API has rate limits. Sync operations respect these limits automatically.

## Next Steps

1. Enhance Goodreads CSV import (add cover image fetching, better genre extraction)
2. Implement recommendation engine
3. Add user discovery/search functionality
4. Add groups feature (v2)
5. Enhance UI with more animations and interactions

For a detailed roadmap, see [PLAN.md](./PLAN.md)

## License

MIT
