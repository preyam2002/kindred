# Deployment Checklist

This document outlines everything required to deploy the Kindred application.

## 1. Environment Variables

Set the following environment variables in your deployment platform (Vercel, Railway, etc.):

### Required

- **`NEXTAUTH_SECRET`**: Generate with `openssl rand -base64 32`
- **`NEXTAUTH_URL`**: Your production URL (e.g., `https://yourdomain.com`)
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase anonymous key

### OAuth Providers (Optional but Recommended)

- **Google OAuth**:

  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - Redirect URI: `https://yourdomain.com/api/auth/callback/google`

- **Twitter/X OAuth**:

  - `TWITTER_CLIENT_ID`
  - `TWITTER_CLIENT_SECRET`
  - Redirect URI: `https://yourdomain.com/api/auth/callback/twitter`

- **MyAnimeList OAuth**:

  - `MYANIMELIST_CLIENT_ID` (register at https://myanimelist.net/apiconfig)
  - `MYANIMELIST_CLIENT_SECRET`
  - Redirect URIs:
    - For authentication (sign-in): `https://yourdomain.com/api/auth/callback/myanimelist`
    - For integration (connecting account): `https://yourdomain.com/api/integrations/myanimelist/callback`

- **Spotify OAuth**:

  - `SPOTIFY_CLIENT_ID` (register at https://developer.spotify.com/dashboard)
  - `SPOTIFY_CLIENT_SECRET`
  - Redirect URI: `https://yourdomain.com/api/integrations/spotify/callback`

- **TMDB (The Movie Database)** (Optional - for movie poster images):
  - `TMDB_API_KEY` (register at https://www.themoviedb.org/settings/api)
  - Note: Free tier available, no OAuth required

## 2. Database Setup

### Supabase Configuration

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `lib/db/schema.sql` in your Supabase SQL Editor
3. **Important**: Run the RLS policies migration from `lib/db/migrations/setup_rls_policies.sql` to allow user signups
4. If you're updating an existing database, run any other migration files from `lib/db/migrations/` in order:
   - `add_avatar_column.sql` (if avatar column is missing)
   - `setup_rls_policies.sql` (required for signups to work)
5. Copy your project URL and anon key to environment variables

## 3. OAuth Provider Configuration

### Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Copy Client ID and Secret to environment variables

### Twitter Developer Portal

1. Go to https://developer.twitter.com/en/portal
2. Create a new app (or edit existing app)
3. **Important**: Configure OAuth 2.0 settings:
   - Go to "User authentication settings" or "App settings"
   - Select "OAuth 2.0" as the authentication method
   - Add callback URLs (both for local development and production):
     - For local development: `http://localhost:5000/api/auth/callback/twitter`
     - For production: `https://yourdomain.com/api/auth/callback/twitter`
   - Set app permissions: Read users, Read tweets (or as needed)
   - Save changes
4. Copy Client ID and Secret to environment variables
5. **Important**: Set `NEXTAUTH_URL` environment variable:
   - For local development: `http://localhost:5000`
   - For production: `https://yourdomain.com`

### MyAnimeList API Config

1. Go to https://myanimelist.net/apiconfig
2. Register a new application
3. Add redirect URI: `https://yourdomain.com/api/integrations/myanimelist/callback`
4. Copy Client ID and Secret to environment variables

### Spotify Developer Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `https://yourdomain.com/api/integrations/spotify/callback`
4. Copy Client ID and Secret to environment variables

## 4. Build & Deployment

### Prerequisites

- Node.js 18+ installed on the deployment platform
- All environment variables configured
- Database schema applied

### Build Commands

```bash
npm install
npm run build
```

### Start Command (if using traditional hosting)

```bash
npm start
```

## 5. Platform-Specific Notes

### Vercel (Recommended for Next.js)

1. Connect your GitHub repository
2. Vercel will auto-detect Next.js
3. Add all environment variables in the Vercel dashboard
4. Deploy automatically on push to main branch

**Note**: Vercel automatically handles:

- Custom domains
- SSL certificates
- Edge network distribution
- Environment variable management

### Other Platforms

For other platforms (Railway, Render, DigitalOcean, etc.):

- Ensure Node.js 18+ is available
- Set all environment variables
- Configure build command: `npm run build`
- Configure start command: `npm start`
- Ensure the platform supports Next.js server-side rendering

## 6. Post-Deployment Verification

1. **Homepage**: Verify landing page loads at root URL
2. **Authentication**: Test login/signup flows
3. **Database**: Verify database connection works
4. **OAuth**: Test each OAuth provider (Google, Twitter)
5. **Integrations**: Test Spotify and MyAnimeList OAuth flows
6. **API Routes**: Verify API endpoints respond correctly
7. **User Profiles**: Test `/u/[username]` pages
8. **Mash Pages**: Test `/mash/[user1]-[user2]` pages

## 7. Security Checklist

- [ ] `NEXTAUTH_SECRET` is set and secure (32+ characters)
- [ ] All OAuth secrets are kept private
- [ ] Database connection uses SSL (Supabase handles this)
- [ ] HTTPS is enabled (most platforms auto-enable)
- [ ] Environment variables are not committed to git

## 8. Optional Optimizations

- Enable Vercel Analytics (if using Vercel)
- Configure custom domain
- Set up error monitoring (Sentry, etc.)
- Configure rate limiting for API routes
- Set up database backups (Supabase handles this)

## Common Issues

### "NEXTAUTH_SECRET is missing"

- Generate and set `NEXTAUTH_SECRET` environment variable

### OAuth redirect URI mismatch

- Ensure callback URLs in OAuth provider dashboards match production URLs exactly

### Twitter OAuth "Something went wrong" error

This error typically occurs due to one of these issues:

1. **Redirect URI mismatch** (most common):
   - The redirect URI in your Twitter Developer Portal must **exactly match** the one being used
   - Check the error URL - it shows the redirect URI being used (e.g., `http://localhost:5000/api/auth/callback/twitter`)
   - Add this exact URL to your Twitter app's "Callback URLs" in the Developer Portal
   - **Important**: Include the port number if using localhost (e.g., `localhost:5000` not just `localhost`)

2. **NEXTAUTH_URL not set correctly**:
   - Set `NEXTAUTH_URL` environment variable to match your app URL:
     - Local: `http://localhost:5000`
     - Production: `https://yourdomain.com`
   - Restart your development server after setting this variable

3. **OAuth 2.0 not configured in Twitter app**:
   - Ensure your Twitter app is configured for OAuth 2.0 (not OAuth 1.0a)
   - Go to Twitter Developer Portal → Your App → User authentication settings
   - Select "OAuth 2.0" as the authentication method
   - Set appropriate app permissions (Read users, Read tweets)

4. **App permissions mismatch**:
   - The scopes requested (`users.read`, `tweet.read`, `offline.access`) must match your app's permissions
   - Verify in Twitter Developer Portal that your app has the required permissions enabled

5. **Client ID/Secret incorrect**:
   - Double-check that `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` match your Twitter app
   - Regenerate credentials if unsure and update environment variables

### Database connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused

### "new row violates row-level security policy" (Error 42501)

- **This is a common issue**: Supabase has Row Level Security (RLS) enabled by default
- **Solution**: Run the RLS policies migration: `lib/db/migrations/setup_rls_policies.sql` in your Supabase SQL Editor
- This migration sets up policies to allow user signups and data access

### "Could not find the 'avatar' column" (Error PGRST204)

- Run the migration: `lib/db/migrations/add_avatar_column.sql` in your Supabase SQL Editor
- Or manually add: `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;`

### Build failures

- Check Node.js version (18+ required)
- Verify all dependencies install correctly
- Check for TypeScript errors: `npm run lint`

## Support

For issues, refer to:

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
