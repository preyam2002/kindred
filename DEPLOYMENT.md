# Deployment Guide for Kindred

This guide covers deploying the Kindred application to production.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Vercel account (or other Next.js hosting)
- OpenAI API key (for AI Chat feature)

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
OPENAI_API_KEY=your-openai-key
```

## Database Setup

1. Run all migrations in `lib/db/migrations/` (see DATABASE_SETUP.md)
2. Verify tables are created correctly
3. Check RLS policies are enabled

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Testing Checklist

- [ ] Sign in works
- [ ] Library functions work
- [ ] All features load correctly
- [ ] AI Chat works
- [ ] Comments can be posted

See DATABASE_SETUP.md for detailed migration instructions.
