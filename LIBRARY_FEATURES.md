# Library Page - Comprehensive Feature Set

## Overview
The enhanced library page provides users with complete control over their media collection with advanced tracking, filtering, and viewing options.

---

## ✅ Implemented Features (Current)

### Basic Features
- ✅ Media grid display with posters
- ✅ Type filtering (All, Books, Anime, Manga, Movies, Music)
- ✅ Basic ratings display (1-10 scale)
- ✅ Empty state with call-to-action
- ✅ Responsive design

---

## 🎯 Enhanced Features (To Implement)

### 1. **View Modes**
- **Grid View**: Large posters with essential info (current default)
- **List View**: Detailed horizontal cards with full metadata
- **Compact View**: Poster-only grid for maximum density

### 2. **Search & Filtering**

**Search:**
- Search by title
- Search by author/artist/creator
- Search by tags

**Filter Options:**
- **Status Filter**: Completed, Watching, Plan to Watch, On Hold, Dropped
- **Rating Range**: Slider to filter 0-10
- **Favorites Only**: Toggle to show only favorites
- **Genre Filter**: Multi-select genre tags
- **Year Filter**: Date range selector
- **Source Filter**: Filter by platform (Goodreads, MAL, Letterboxd, Spotify)

### 3. **Sorting Options**
- By Rating (Highest/Lowest)
- By Date Added (Newest/Oldest)
- By Start Date
- By Finish Date
- By Title (A-Z/Z-A)
- By Creator
- By Progress (Most/Least Complete)

### 4. **Status Tracking**

**Available Statuses:**
- **Completed**: Finished consuming
- **Watching/Reading/Listening**: Currently in progress
- **Plan to Watch/Read/Listen**: Backlog
- **On Hold**: Temporarily paused
- **Dropped**: Abandoned

**Features:**
- Quick status change from card
- Status filter in header
- Status badge on cards
- Status distribution chart

### 5. **Progress Tracking**

**Books:**
- Pages read / Total pages
- Reading dates (start/finish)
- Reread count

**Anime/Manga:**
- Episodes/Chapters watched/read
- Total episodes/chapters
- Progress percentage bar
- Rewatch/Reread count

**Movies:**
- Watch count
- Watch dates

**Music:**
- Play count
- Total hours listened
- Last played date

### 6. **User-Specific Metadata**

**For All Media:**
- Personal rating (1-10)
- Date added to library
- Start date
- Finish date
- Times consumed (rewatch/reread/relisten count)
- Favorite flag ⭐
- Personal notes (rich text)
- Custom tags
- Source rating (original rating from platform)

**Media-Specific:**
- **Books**: Reading status, bookshelf tags from Goodreads
- **Movies**: Watch date, Letterboxd tags
- **Anime/Manga**: Watch status from MAL
- **Music**: Play count from Spotify

### 7. **Statistics Dashboard**

**Overall Stats:**
- Total items in library
- Items by type (books, movies, etc.)
- Average rating
- Total items rated
- Completion rate
- Items added this week/month

**Media-Specific Stats:**
- Books: Total pages read, average book rating, reading streak
- Movies: Total runtime watched, favorite genres
- Anime: Total episodes watched, favorite studios
- Music: Total hours listened, top artists

**Time-Based Stats:**
- Items consumed by month/year
- Reading/watching trends
- Most active periods

### 8. **Quick Actions**

**On Each Card:**
- Edit rating (inline)
- Change status (dropdown)
- Update progress (inline)
- Toggle favorite
- Add to list
- Share
- Delete from library
- View details

**Bulk Actions:**
- Select multiple items
- Bulk status change
- Bulk tag addition
- Bulk delete
- Export selection

### 9. **List Management**

**Pre-defined Lists:**
- Favorites
- Currently Watching/Reading
- Completed
- Plan to Watch/Read
- Dropped

**Custom Lists:**
- Create custom collections
- "Summer 2024 Reads"
- "Comfort Movies"
- "Study Music"
- Drag & drop to organize

### 10. **Advanced Features**

**Smart Collections:**
- Recently Added (last 30 days)
- Recently Completed
- Top Rated (8+ rating)
- Long Backlog (plan to watch >100 days)
- Highly Recommended (from matches)

**Analytics:**
- Genre distribution pie chart
- Rating distribution histogram
- Consumption timeline
- Year-over-year comparison
- Reading/watching velocity

**Export Options:**
- Export to CSV
- Export to JSON
- Generate reading list PDF
- Share collection link

---

## 📊 Enhanced Card Components

### Grid View Card Shows:
- Poster image
- Title
- Creator (author/artist)
- Rating badge
- Status badge
- Progress bar (if in progress)
- Favorite star
- Genre tags (first 2)
- Quick actions menu

### List View Card Shows:
- Thumbnail poster
- Full title
- Creator/author
- Full description/notes
- All genres
- Rating
- Status
- Progress (episodes/chapters)
- Dates (start/finish)
- Times consumed
- Tags
- Quick edit buttons

### Compact View Card Shows:
- Poster only
- Rating overlay
- Tooltip with full details on hover

---

## 🎨 UI/UX Enhancements

### Visual Feedback:
- Hover effects on cards
- Loading skeletons
- Smooth animations (Framer Motion)
- Toast notifications for actions
- Drag-and-drop for list management

### Accessibility:
- Keyboard navigation
- ARIA labels
- Screen reader support
- High contrast mode support
- Focus indicators

### Responsive Design:
- Mobile: Single column list
- Tablet: 2-3 column grid
- Desktop: 4-6 column grid
- Large screens: 6-10 column grid

---

## 🔧 Database Schema Updates Required

The migration file `add_user_media_tracking_fields.sql` adds:

```sql
-- New columns in user_media table:
- status (VARCHAR)
- progress (INTEGER)
- progress_total (INTEGER)
- times_consumed (INTEGER)
- start_date (TIMESTAMP)
- finish_date (TIMESTAMP)
- is_favorite (BOOLEAN)
- notes (TEXT)
- source_rating (VARCHAR)
```

---

## 🚀 Implementation Steps

### Phase 1: Database & Types ✅
1. ✅ Create migration file for new fields
2. ✅ Update TypeScript types (UserMedia, MediaStatus)
3. ⏳ Run migration on Supabase
4. ⏳ Update API routes to include new fields

### Phase 2: Enhanced Library UI 🔄
1. ⏳ Create enhanced library page with view modes
2. ⏳ Add MediaCard components (Grid, List, Compact)
3. ⏳ Implement search functionality
4. ⏳ Implement filtering (status, rating, favorites)
5. ⏳ Implement sorting options
6. ⏳ Add stats dashboard

### Phase 3: Status & Progress Tracking
1. ⏳ Add status selector to cards
2. ⏳ Add progress tracking UI
3. ⏳ Create edit modal for detailed updates
4. ⏳ Add favorite toggle
5. ⏳ Add notes editor

### Phase 4: Lists & Collections
1. ⏳ Create list management UI
2. ⏳ Add custom list creation
3. ⏳ Implement drag-and-drop
4. ⏳ Add bulk actions

### Phase 5: Analytics & Stats
1. ⏳ Create stats dashboard
2. ⏳ Add charts (genre distribution, ratings, timeline)
3. ⏳ Calculate time-based stats
4. ⏳ Add export functionality

### Phase 6: Testing & Polish
1. ⏳ E2E testing with real data
2. ⏳ Mobile responsive testing
3. ⏳ Performance optimization
4. ⏳ Accessibility audit

---

## 📝 API Routes to Update/Create

### Existing Routes to Update:
- `GET /api/library` - Include all new fields in response
- `PUT /api/library/[id]` - Update user_media with new fields

### New Routes to Create:
- `PATCH /api/library/[id]/status` - Quick status update
- `PATCH /api/library/[id]/progress` - Quick progress update
- `PATCH /api/library/[id]/favorite` - Toggle favorite
- `GET /api/library/stats` - Get library statistics
- `POST /api/library/lists` - Create custom list
- `GET /api/library/lists` - Get all lists
- `PUT /api/library/lists/[id]` - Update list
- `DELETE /api/library/lists/[id]` - Delete list

---

## 🧪 E2E Testing Checklist

### Setup:
- [ ] Run database migration
- [ ] Import sample data (books, movies, anime, music)
- [ ] Ensure integrations are connected

### Core Features:
- [ ] View all media types
- [ ] Filter by type
- [ ] Search by title
- [ ] Sort by rating/date/title
- [ ] Switch view modes (grid/list/compact)

### Enhanced Features:
- [ ] Update status for an item
- [ ] Update progress (episodes/chapters)
- [ ] Toggle favorite
- [ ] Add/edit notes
- [ ] Filter by status
- [ ] Filter by rating range
- [ ] View stats dashboard

### User Flows:
- [ ] Add new item to library
- [ ] Mark item as completed
- [ ] Rewatch/reread an item (increment times_consumed)
- [ ] Track reading progress for a book
- [ ] Track watching progress for anime
- [ ] Create custom list
- [ ] Add items to custom list

### Performance:
- [ ] Test with 100+ items
- [ ] Test with 1000+ items
- [ ] Check load times
- [ ] Check search performance
- [ ] Check filter performance

---

## 💡 Future Enhancements

### Social Features:
- Share your library with friends
- Compare libraries with matches
- See what friends are watching/reading
- Recommendations based on library

### AI Features:
- Auto-generate reading list
- Suggest next watch based on mood
- Analyze viewing patterns
- Predict ratings for unrated items

### Integrations:
- Sync reading progress with Kindle
- Sync watch progress with Crunchyroll
- Auto-update from connected platforms
- Cross-platform status sync

---

## 📚 Resources

- **Design Inspiration**: MyAnimeList, Letterboxd, Goodreads, IMDb
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts, Chart.js
- **Drag & Drop**: dnd-kit
- **Rich Text**: TipTap, Slate

---

## Status: 🚧 In Development

**Current Progress**:
- Database schema: ✅ Complete
- TypeScript types: ✅ Complete
- Basic UI: ✅ Complete
- Enhanced UI: 🔄 In Progress (15%)
- Status tracking: ⏳ Planned
- Progress tracking: ⏳ Planned
- Lists & collections: ⏳ Planned
- Analytics: ⏳ Planned

**Next Steps**:
1. Run database migration
2. Implement enhanced library page UI
3. Add status and progress tracking
4. Test E2E functionality
