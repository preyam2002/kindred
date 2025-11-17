# Database Development Workflow

This directory contains scripts to help you iterate on your database schema during development without running migrations repeatedly.

## Quick Reset (Recommended)

The **easiest** way to reset your database during development:

1. **Open Supabase Dashboard** → SQL Editor → New Query
2. **Copy and paste** `scripts/reset-and-setup.sql`
3. **Click Run** ✅

That's it! This single file:
- Drops all existing tables
- Creates all tables from scratch
- Sets up RLS policies
- Creates indexes and triggers

## Alternative Methods

### Method 1: Using npm scripts

```bash
# Show the reset SQL (copy it)
npm run db:reset

# Get interactive help
npm run db:help
```

### Method 2: Manual step-by-step

If you prefer more control:

1. Run `scripts/reset-db-simple.sql` (drops tables)
2. Run `lib/db/schema.sql` (creates tables)
3. Run `lib/db/migrations/setup_rls_policies.sql` (RLS policies)

## Files Explained

- **`reset-and-setup.sql`** - Single file that does everything (recommended)
- **`reset-db-simple.sql`** - Just drops tables (use with schema.sql)
- **`reset-db.sh`** - Interactive helper script
- **`reset-db-dev.ts`** - TypeScript script (requires service role key)

## Workflow Tips

1. **Keep `schema.sql` as source of truth** - Update it when you change your schema
2. **Use `reset-and-setup.sql` for quick resets** - It's a combined version of schema + RLS
3. **Save as Supabase snippet** - Save the reset script as a snippet in Supabase for one-click reset
4. **For production**: Use proper migrations in `lib/db/migrations/`

## Production vs Development

- **Development**: Use `reset-and-setup.sql` for quick iteration
- **Production**: Use migration files in `lib/db/migrations/` to preserve data

## Troubleshooting

**"Policy already exists" errors**: Normal during development - the script uses `DROP POLICY IF EXISTS` to handle this.

**Foreign key constraint errors**: The reset script uses `CASCADE` to drop dependent tables automatically.

**Tables not appearing**: Make sure you're looking at the correct Supabase project!






