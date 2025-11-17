# MAL Rating Issue - Fix Documentation

## Problem
Ratings from MyAnimeList (MAL) are not being retrieved when syncing user data.

## Root Cause
The MAL API v2 requires explicit field requests when using nested objects. When requesting `my_list_status`, you need to explicitly specify which fields within it you want, including `score`.

## Solution
Updated the field requests in `lib/integrations/myanimelist.ts` to explicitly request the `score` field within `my_list_status`:

**Before:**
```typescript
const fields = "id,title,main_picture,mean,genres,media_type,num_episodes,status,my_list_status";
```

**After:**
```typescript
const fields = "id,title,main_picture,mean,genres,media_type,num_episodes,status,my_list_status{score,status,updated_at}";
```

## Changes Made
1. Updated `getMALAnimeList()` function to request `my_list_status{score,status,updated_at}`
2. Updated `getMALMangaList()` function to request `my_list_status{score,status,updated_at}`

## Important Note
⚠️ **OAuth Requirement**: Even with this fix, the MAL API might not return `score` values when using only `CLIENT_ID` (client_auth). According to MAL API documentation, user-specific data like scores may require OAuth authentication. 

If ratings still don't appear after this fix, you may need to:
1. Implement OAuth flow for MAL (the code already has OAuth functions, but they're marked as deprecated)
2. Use OAuth tokens instead of just CLIENT_ID when fetching user lists

## Testing
Use the test script to verify the API response:
```bash
MYANIMELIST_CLIENT_ID=your_client_id npx tsx scripts/test-mal-rating.ts
```

## Expected Response Structure
See `scripts/mal-api-response-example.json` for an example of what the API response should look like.

The `list_status` object should include:
- `score`: number (0-10, where 0 means unrated)
- `status`: string (watching, completed, on_hold, dropped, plan_to_watch)
- `updated_at`: string (ISO 8601 timestamp)

## Current Code Logic
The code filters out ratings where `score` is 0 or undefined:
```typescript
const rating = item.listStatus?.score && item.listStatus.score > 0
  ? item.listStatus.score
  : undefined;
```

This is correct behavior - it only saves ratings that are greater than 0.

