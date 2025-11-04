# Kindred - Pitch Deck

## The Problem

People want to connect with others who share their deep interests, but dating apps rely on surface-level prompts and shallow profiles.

Current solutions:

- **Dating apps (Hinge, Bumble)**: Limited to 3 prompts and basic interests
- **Social platforms (Letterboxd, Goodreads)**: Have social features but no matchmaking
- **Niche apps (Tastebuds, Book Lovers)**: Failed to gain traction, poor UX

**The insight**: People already track what they love—500+ movies on Letterboxd, 1000+ books on Goodreads—but no one uses this rich data for meaningful connections.

---

## The Solution

**Kindred** is a viral compatibility checker that matches people based on their actual media tastes.

### How it works:

1. User imports their Letterboxd data (later: Goodreads, MyAnimeList)
2. Shares a personalized link on Twitter: `kindred.app/@username`
3. Friends click the link, add their data, see instant compatibility score + fun facts
4. Each comparison encourages the new user to share their link → viral growth loop

### Example fun facts:

- "You both gave Fight Club 5 stars"
- "You both think Inception is overrated (2 stars)"
- "You've watched 87% of the same movies"
- "Your favorite genres are 92% aligned"

---

## Why This Works

### 1. Built-in viral mechanics

- Every result is shareable content
- Curiosity-driven: "I wonder if we're compatible?"
- Low stakes (platonic, not dating)
- Each user becomes a distribution channel

### 2. Rich data advantage

- Comparing 500+ rated films vs. "favorite movie"
- Rating patterns, genre preferences, divergences
- Deep compatibility signals vs. surface-level matching

### 3. Twitter-native distribution

- Login with Twitter → instant sharing
- No marketing budget needed
- Built for virality from day one

### 4. Clear evolution path

- Start: Fun platonic compatibility checker (low risk)
- Validate: Prove the algorithm works
- Pivot: Introduce dating features once traction is proven

---

## Market Opportunity

### Target Audience

- **Primary**: Media trackers (Letterboxd: 14M+ users, Goodreads: 150M+ users)
- **Secondary**: Gen Z/Millennial Twitter users seeking authentic connections
- **Overlap**: People who actively track AND actively share

### Market Size

- Dating app market: $10.87B (2024), growing to $14.39B by 2028
- Social media users: 5.17B globally
- Media tracking platforms: 180M+ combined users

### Competition

- **Dating apps**: Hinge, Bumble, OkCupid (surface-level matching)
- **Niche apps**: Tastebuds, Vinylly (music-only, poor traction)
- **Social platforms**: Letterboxd, Goodreads (no matchmaking)

**Kindred's edge**: Deep compatibility data + viral mechanics + Twitter-native growth

---

## Business Model

### Phase 1 (MVP): Free

- Build user base through viral growth
- Validate product-market fit
- Prove the algorithm works

### Phase 2: Freemium

- **Free tier**: Basic compatibility scores, limited comparisons
- **Premium ($4.99/mo)**: Unlimited comparisons, detailed insights, advanced stats
- **Revenue potential**: 10K users × 5% conversion × $4.99 = $2,495/mo

### Phase 3: Dating Pivot

- Premium dating features ($9.99/mo)
- Match discovery beyond friends
- Advanced filtering and preferences
- Revenue potential: Hinge average revenue per user = $15-20/year

---

## Traction & Metrics

### Success Metrics (MVP)

- **10K users in 60 days** (viral coefficient >1.5)
- **50%+ share rate** (users who create their own link)
- **3-minute average import time** (low friction)
- **60%+ completion rate** (users who finish import)

### Growth Strategy

1. **Seed with influencers**: Film Twitter, BookTok crossover accounts
2. **Viral loop**: Each user shares → 2+ friends join → compound growth
3. **Platform expansion**: Start Letterboxd → add Goodreads → add MAL
4. **Content flywheel**: Share your compatibility results → drive traffic back

---

## Product Roadmap

### MVP (Months 1-2): Letterboxd Only

- Import flow (CSV upload)
- Link-based sharing (`kindred.app/@username`)
- Compatibility score + fun facts
- Twitter sharing integration
- **Goal**: Validate viral mechanics

### Phase 2 (Months 3-4): Multi-Platform

- Add Goodreads import
- Add MyAnimeList import
- Enhanced matching algorithm
- **Goal**: Prove multi-platform value

### Phase 3 (Months 5-6): Dating Features

- Opt-in dating mode
- Discovery beyond friends
- Match recommendations
- **Goal**: Monetization ready

---

## Why Now?

1. **Post-pandemic dating fatigue**: People want authentic connections
2. **Rise of media tracking**: Letterboxd grew from 1.8M → 14M users (2020-2023)
3. **Twitter/X engagement**: Perfect distribution channel for viral content
4. **Algorithm advantage**: Rich taste data > generic prompts
5. **Proven pattern**: Viral quizzes/compatibility tests consistently work

---

## Competitive Advantages

### 1. Data moat

- Users import 500+ data points (not 3 prompts)
- Rich compatibility signals hard to replicate
- Rating patterns, not just shared titles

### 2. Viral design

- Product IS the distribution channel
- No paid acquisition needed
- Network effects from day one

### 3. Platform-specific execution

- Twitter-native from launch
- Built for sharing, not matching
- Low-stakes entry point

### 4. Evolution strategy

- Validate with platonic matching (low risk)
- Pivot to dating once proven (high upside)
- Clear path to monetization

---

## Team & Ask

### The Ask: $150K pre-seed

**Use of funds**:

- $80K: Development (6 months runway)
- $40K: Infrastructure & APIs
- $30K: Initial marketing (influencer seeding)

### Milestones:

- Month 1: Ship Letterboxd MVP
- Month 2: Hit 10K users (viral validation)
- Month 3: Add Goodreads + MAL
- Month 6: Dating pivot + monetization

---

## Why This Will Win

Most dating apps treat interests as decoration. Kindred treats them as data.

We're not building another dating app. We're building a viral compatibility tool that _becomes_ a dating app once we prove the algorithm works.

**The bet**: People with 87% media taste overlap are more compatible than people who both selected "hiking" from a dropdown menu.

**The edge**: We have the data to prove it.

**The ask**: Fund us to build it.

---

## Contact

**Kindred** - Find your kindred spirits through what you actually love.

`kindred.app` | `@kindredapp`

---

---

# TECHNICAL PLAN (For Reference)

## Project Overview

kindred is a social platform that aggregates tracked activity from Goodreads, MyAnimeList, Letterboxd, and Spotify to connect users through shared tastes with MashScore compatibility matching.

## ✅ Completed Features

### Authentication & Core Infrastructure

- [x] Next.js 15 setup with TypeScript
- [x] Tailwind CSS v4 with black/pink/purple color scheme
- [x] Shadcn/UI component library
- [x] Database schema (PostgreSQL via Supabase)
- [x] NextAuth.js authentication
- [x] Email-based authentication
- [x] Google OAuth
- [x] X (Twitter) OAuth

### User Interface

- [x] Animated landing page with minimalist design
- [x] Login/Signup pages
- [x] User profile pages (`/u/[username]`)
- [x] Media filtering (books, anime, manga, movies, music)
- [x] Mash-up comparison pages (`/mash/[user1]-[user2]`)
- [x] Settings/Integrations page
- [x] Share functionality (links, tweets, OG images)

### Integrations

- [x] **Goodreads** - CSV import (API deprecated)

  - CSV parser
  - Upload UI
  - Data syncing
  - Rating conversion (0-5 to 1-10)

- [x] **Letterboxd** - CSV import

  - CSV parser
  - Upload UI
  - Data syncing
  - Rating conversion (0.5-5 to 1-10)

- [x] **MyAnimeList** - OAuth 2.0 + PKCE
  - OAuth flow implementation
  - Token refresh handling
  - Anime list syncing
  - Manga list syncing
  - Automatic data fetching

### Core Features

- [x] Matching engine (MashScore calculation)

  - Overlap percentage
  - Rating correlation
  - Genre similarity
  - Weighted scoring algorithm

- [x] Share functionality
  - Copy mash links
  - Twitter/X sharing
  - OG image generation
  - Profile sharing

## 🚧 In Progress

### Automatic Match Calculation

- [ ] Background job system for pre-calculating matches
- [ ] Cache match results to avoid recalculation
- [ ] Store top matches per user
- [ ] Performance optimization for large user bases

## 📋 Next Steps (Priority Order)

### Phase 1: Complete MVP Integrations ✅

1. **Spotify OAuth Integration** ✅

   - [x] Register Spotify app
   - [x] Implement OAuth 2.0 flow
   - [x] Fetch user's saved tracks/albums/playlists
   - [x] Store music metadata
   - [x] Sync functionality

### Phase 2: Core Features ✅

2. **Dashboard/Homepage** ✅

   - [x] Logged-in user dashboard
   - [x] Recent matches display
   - [x] Activity feed
   - [x] Quick stats (total items, compatibility scores)
   - [x] Suggested matches
   - [x] Media breakdown
   - [x] Redirect from landing page when logged in

3. **Recommendations Engine** ✅

   - [x] Collaborative filtering
   - [x] "Users like you also liked" algorithm
   - [x] Content-based recommendations
   - [x] Display on user dashboard
   - [x] API endpoint for recommendations

4. **User Discovery** ✅
   - [x] Search users by username (`/discover` page)
   - [x] Browse users with similar tastes
   - [x] Suggested matches page
   - [x] Recent activity feed
   - [x] Filtering and sorting options

### Phase 3: Enhanced Matching

5. **Automatic Match Calculation**

   - Background job system
   - Pre-calculate matches for all users
   - Store top matches per user
   - Performance optimization

6. **Match Discovery Page** ✅

   - [x] `/matches` route
   - [x] Show users sorted by compatibility
   - [x] Filter by minimum MashScore
   - [x] One-click mash comparison

7. **Mash History**
   - Track previous comparisons
   - Show match history per user
   - Revisit old comparisons

### Phase 4: Data Enhancements

8. **Cover Image Fetching** ✅

   - [x] Open Library API for books (implemented)
   - [x] TMDB API for movies (implemented)
   - [x] MAL already has covers (from API)
   - [x] Spotify album art from API (from API)
   - [x] Batch update API endpoint for missing covers
   - [ ] Background job to update missing covers (optional)
   - [x] Fallback handling improvements

9. **LLM Insights with Anthropic** ✅

   - [x] Set up Anthropic API integration
   - [x] Create insights generation system
   - [x] Analyze compatibility patterns
   - [x] Generate personalized insights for matches
   - [x] Display insights on mash pages

10. **Better Genre Extraction**

- Parse genres from Goodreads bookshelves
- Extract genres from Letterboxd tags
- Standardize genre taxonomy
- Genre-based recommendations

11. **Automatic Syncing**
    - Scheduled background syncs
    - Webhook support (where available)
    - Incremental updates
    - Sync status indicators

### Phase 5: Social Features (V2)

11. **Groups Feature**

    - Auto-create groups for >60% similarity
    - Group pages
    - Group discussions
    - Group recommendations

12. **Activity Feed**

    - Recent mash comparisons
    - New connections
    - Shared media
    - Recommendations

13. **Discussions/Threads**
    - Comment on mash results
    - Discussion threads in groups
    - Media reviews

### Phase 6: UX & Polish

14. **Navigation & Layout**

    - Header with user menu
    - Footer with links
    - Breadcrumbs
    - Mobile navigation menu

15. **Error Handling**

    - Better error states
    - User-friendly error messages
    - Retry mechanisms
    - Offline detection

16. **Loading States**

    - Skeleton loaders
    - Progress indicators
    - Optimistic UI updates
    - Perceived performance improvements

17. **Mobile Optimization**
    - Responsive design improvements
    - Touch-friendly interactions
    - Mobile navigation
    - Image optimization

### Phase 7: Performance & Scaling

18. **Caching Strategy**

    - Match result caching
    - User data caching
    - API response caching
    - CDN for static assets

19. **Pagination**

    - Media list pagination
    - Match results pagination
    - Infinite scroll options
    - Virtual scrolling for large lists

20. **Background Jobs**
    - Queue system for matches
    - Async processing
    - Job monitoring
    - Failure handling

### Phase 8: Advanced Features

21. **Analytics Dashboard**

    - User statistics
    - Taste evolution over time
    - Compatibility trends
    - Most compatible users

22. **Export/Backup**

    - Export user data
    - Download mash results
    - Data portability

23. **Privacy Controls**
    - Private profiles
    - Hide specific media
    - Control visibility
    - GDPR compliance

## 🎯 Current Sprint: Automatic Match Calculation

### Tasks

- [ ] Implement background job system (consider Vercel Cron or similar)
- [ ] Pre-calculate matches for all user pairs
- [ ] Cache match results in database
- [ ] Optimize match calculation performance
- [ ] Add match refresh triggers when user data changes

### Technical Notes

- Current issue: Matches recalculated on every request (performance bottleneck)
- Solution: Pre-calculate and cache matches, update on data changes
- Consider: Vercel Cron Jobs, Supabase Edge Functions, or Next.js API routes with cron
- Store matches in `matches` table (already exists in schema)
- Cache invalidation: When user_media is updated, recalculate affected matches

## 📊 Progress Tracking

### MVP Completion: ~98%

- ✅ Core infrastructure: 100%
- ✅ Authentication: 100%
- ✅ UI/UX: 95%
- ✅ Integrations: 100% (4/4 platforms complete)
- ✅ Matching: 100%
- ✅ Share functionality: 100%
- ✅ Logo/branding: 100%
- ✅ Recommendations: 100%
- ✅ Discovery: 100%
- ✅ Match Discovery Page: 100%
- ✅ Cover Images: 95% (batch endpoint complete)
- ✅ LLM Insights: 100% (fully implemented)
- ⚠️ Groups: 0%

### Target MVP Completion: 100%

- [x] Complete all 4 integrations
- [x] Basic recommendations
- [x] User discovery/search
- [x] Core matching working end-to-end
- [x] Enhanced cover image fetching
- [x] LLM-powered insights
- [ ] Automatic match calculation/caching

## 🐛 Known Issues / Technical Debt

- Goodreads API deprecated (using CSV import workaround)
- OG image generation may need edge runtime optimization
- Match calculation not cached (recalculated on each request)
- No pagination for large media lists
- Limited error handling in some API routes

## 📝 Notes

- Database schema supports all planned features
- Color scheme: black, pink, purple (no gradients)
- Design philosophy: minimalist and clean
- All integrations use same data model (media_items + user_media)
