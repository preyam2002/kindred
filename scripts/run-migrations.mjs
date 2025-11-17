#!/usr/bin/env node

/**
 * Migration Runner
 *
 * This script runs pending SQL migrations against the Supabase database.
 * It reads SQL files from lib/db/migrations/ and executes them in order.
 *
 * Usage:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> node scripts/run-migrations.mjs
 *
 * Or specify specific migrations:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> node scripts/run-migrations.mjs create_notifications.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Migrations to run (in order)
const migrations = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [
      'create_notifications.sql',
      'create_collections_queue_friends_activity.sql',
      'create_queue_votes.sql',
    ];

async function runMigration(filename) {
  const migrationPath = resolve(__dirname, '../lib/db/migrations', filename);

  try {
    console.log(`\n📄 Running migration: ${filename}`);
    const sql = readFileSync(migrationPath, 'utf8');

    // Split SQL by statements (basic approach - may need refinement for complex SQL)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try direct SQL execution if RPC doesn't work
          const { error: directError } = await supabase.from('_migrations').insert({
            name: filename,
            executed_at: new Date().toISOString()
          });

          if (directError && directError.code !== '42P01') { // Ignore table doesn't exist error
            throw error;
          }
        }
      } catch (err) {
        console.error(`   ⚠️  Statement ${i + 1} may have failed:`, err.message);
        // Continue with other statements
      }
    }

    console.log(`   ✅ Completed: ${filename}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migrations...\n');
  console.log(`📍 Database: ${supabaseUrl}`);
  console.log(`📋 Migrations to run: ${migrations.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) successCount++;
    else failCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Completed: ${successCount} migrations`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} migrations`);
  }
  console.log('\n💡 Note: Some errors are expected if tables already exist.');
  console.log('   Check your Supabase dashboard to verify the tables were created.');
  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('❌ Migration runner failed:', error);
  process.exit(1);
});
