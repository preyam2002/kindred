# Kindred

A social taste-matching platform that aggregates your tracked media activity from Goodreads, MyAnimeList, Letterboxd, and Spotify to connect you with people who share your tastes.

**Live Demo**: [seamless-phi.vercel.app](https://seamless-phi.vercel.app)

## What is Kindred?

Kindred is a social discovery platform that aggregates your media activity from various sources (Goodreads, MyAnimeList, Letterboxd, Spotify) and helps you discover people with similar tastes. The platform calculates a "MashScore" to quantify taste compatibility between users.

## Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4 with tw-animate-css
- **Animations**: Framer Motion 12.23.24
- **Database**: Supabase (PostgreSQL) via @supabase/supabase-js 2.78.0 and @supabase/ssr 0.7.0
- **Authentication**: NextAuth.js 5.0.0-beta.30
- **3D Graphics**: Three.js (@react-three/fiber 9.4.0, @react-three/drei 10.7.7) with three 0.181.1
- **AI Integration**: Anthropic SDK 0.68.0, OpenAI 6.9.0
- **Image Generation**: html2canvas 1.4.1, @vercel/og 0.8.5
- **Testing**: Vitest 4.0.9 with @vitest/ui
- **Icons**: Lucide React 0.552.0
- **UI Components**: Radix UI (@radix-ui/react-dialog, @radix-ui/react-label, @radix-ui/react-slot)
- **Utilities**: clsx 2.1.1, class-variance-authority 0.7.1, tailwind-merge 3.3.1
- **Date**: date-fns 4.1.0
- **Archive**: adm-zip 0.5.16
- **Web Scraping**: cheerio 1.1.2

## Key Features

### Taste Matching
- Aggregates media from Goodreads, MyAnimeList, Letterboxd, and Spotify
- AI-powered taste compatibility scoring (MashScore)
- Personalized recommendations based on taste overlap

### Media Management
- Personal library management with ratings and favorites
- Media collections for organizing content
- Import from CSV files and OAuth integrations
- Queue management for watch lists
- Mood-based discovery

### Social Features
- Friend connections and friend requests
- Blind match discovery (swipe-based matching)
- Taste Twins - find users with identical preferences
- Activity feeds showing friend activities
- Group consensus suggestions for group viewing
- Watch Together sessions for synchronized viewing
- Real-time chat interface

### Gamification
- Taste challenges with streaks
- Roulette for random media discovery
- AI-generated Taste Art
- Leaderboards and rankings
- Share cards for social media
- Year Wrapped summaries

### AI-Powered Features
- Taste DNA analysis and visualization
- Personalized recommendations using OpenAI/Claude
- AI-generated insights about your taste profile
- Automated content suggestions

## Project Structure

```
kindred/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page with CTA
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles and animations
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   ├── dashboard/                # Main dashboard with stats
│   ├── discover/                 # Discovery page for finding users
│   ├── matches/                  # Taste matches listing
│   ├── friends/                  # Friends management
│   ├── library/                  # Personal library and ratings
│   ├── collections/              # User collections
│   ├── recommendations/          # AI-powered recommendations
│   ├── taste-dna/                # Taste analysis visualization
│   ├── taste-match/              # Matching interface
│   ├── taste-twins/              # Find similar users
│   ├── taste-art/                # AI art generation
│   ├── taste-challenge/          # Challenge system
│   ├── roulette/                 # Random discovery spinner
│   ├── mood-discovery/           # Mood-based discovery
│   ├── queue/                    # Watch queue management
│   ├── notifications/            # Notifications center
│   ├── chat/                     # Chat interface
│   ├── watch-together/           # Watch together sessions
│   ├── group-consensus/          # Group suggestion engine
│   ├── blind-match/              # Blind matching (tinder-style)
│   ├── social-feed/              # Social activity feed
│   ├── share-cards/              # Generate shareable cards
│   ├── leaderboards/             # User rankings
│   ├── year-wrapped/             # Annual summary
│   ├── analytics/                # Analytics dashboard
│   ├── u/[username]/             # User public profiles
│   │   ├── page.tsx              # Profile page
│   │   └── queue/                # Public queue view
│   ├── [user1]/[user2]/          # Compare two users
│   ├── mash/[username]/          # Taste mash page
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   ├── friends/              # Friend management API
│   │   ├── library/              # Library API
│   │   ├── collections/          # Collections API
│   │   ├── matches/              # Matches API
│   │   ├── recommendations/      # Recommendations API
│   │   ├── taste-dna/            # Taste DNA API
│   │   ├── insights/             # Insights API
│   │   ├── activity/             # Activity API
│   │   ├── challenges/           # Challenges API
│   │   ├── roulette/             # Roulette API
│   │   ├── blind-match/          # Blind match API
│   │   ├── mood-discovery/       # Mood API
│   │   ├── watch-together/       # Watch together API
│   │   ├── group-consensus/      # Consensus API
│   │   ├── chat/                 # Chat API
│   │   ├── comments/             # Comments API
│   │   ├── mash/                 # Mash API
│   │   ├── share/                # Share API
│   │   ├── year-wrapped/         # Wrapped API
│   │   ├── social-proof/         # Social proof API
│   │   ├── analytics/            # Analytics API
│   │   ├── cover-images/         # Cover images API
│   │   ├── dashboard-enhanced/   # Enhanced dashboard
│   │   ├── leaderboards/         # Leaderboards API
│   │   ├── waitlist/             # Waitlist API
│   │   ├── media/                # Media API
│   │   └── taste-art/            # Taste art API
│   └── test/                     # Test pages
├── components/                   # React components
│   ├── providers.tsx             # Context providers (auth, etc.)
│   └── authenticated-layout.tsx  # Layout wrapper for auth
├── lib/                          # Utilities
│   ├── utils.ts                  # General utilities
│   ├── auth/                     # Authentication logic
│   ├── integrations/             # Third-party API integrations
│   └── supabase/                 # Supabase client
├── scripts/                      # Database scripts
│   └── reset-and-setup.sql       # Database setup
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## NPM Scripts

```bash
npm run dev           # Start dev server on port 5001
npm run build         # Build for production
npm run start         # Start production server on port 5001
npm run lint          # Run ESLint
npm run test          # Run Vitest tests in watch mode
npm run test:run      # Run tests once
npm run db:reset      # Display database reset SQL
npm run db:help       # Show database reset help
```

## Database Schema

Uses Supabase PostgreSQL with tables for:
- **users**: User accounts and profiles
- **media_items**: Books, movies, anime, music tracks
- **user_libraries**: User ratings and library entries
- **friend_connections**: Friend relationships
- **taste_matches**: Pre-calculated match scores
- **collections**: User-created collections
- **activities**: Activity feed entries
- **challenges**: Challenge data and progress
- **notifications**: User notifications
- **chat_messages**: Chat history
- **watch_together_sessions**: Synchronized viewing sessions

## Authentication

Uses NextAuth.js with credentials provider and JWT session strategy. OAuth providers can be configured for Google and Twitter.

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Required variables:
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - GOOGLE_CLIENT_ID (optional)
# - GOOGLE_CLIENT_SECRET (optional)

# Set up database
cat scripts/reset-and-setup.sql | psql

# Run development server
npm run dev
```

Open [http://localhost:5001](http://localhost:5001) to view it in the browser.

## Documentation

- [Summary](./SUMMARY.md) - Project overview and features
- [E2E Testing Guide](./E2E_TESTING_GUIDE.md) - Testing documentation
- [Library Features](./LIBRARY_FEATURES.md) - Feature documentation
- [Database Setup](./DATABASE_SETUP.md) - Database configuration
- [AI Features](./AI_FEATURES.md) - AI integration details
- [Deployment](./DEPLOYMENT.md) - Deployment guide

## Roadmap

- [ ] Mobile app (React Native)
- [ ] More integrations (Netflix, Steam, Apple Music)
- [ ] Enhanced AI recommendations
- [ ] Group matching features
- [ ] Taste prediction model
- [ ] Trending content discovery

## Author

**Preyam** - [GitHub](https://github.com/preyam2002)

## License

MIT
