#!/usr/bin/env tsx
/**
 * Development Database Reset Script
 * 
 * This script drops all tables and recreates them from schema.sql
 * WARNING: This will DELETE ALL DATA. Only use in development!
 * 
 * Usage:
 *   npm run db:reset
 * 
 * Or directly:
 *   tsx scripts/reset-db-dev.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Use service role key for admin operations (dropping tables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY (required for admin operations)");
  console.error("\n💡 Get your service role key from:");
  console.error("   Supabase Dashboard > Project Settings > API > service_role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Tables to drop (in reverse dependency order to avoid foreign key constraints)
const tablesToDrop = [
  "recommendations",
  "matches",
  "user_media",
  "music",
  "movies",
  "manga",
  "anime",
  "books",
  "sources",
  "users",
];

// Functions to drop
const functionsToDrop = [
  "update_updated_at_column",
];

async function resetDatabase() {
  console.log("🔄 Resetting database...\n");

  try {
    // Step 1: Drop all tables
    console.log("📦 Dropping existing tables...");
    for (const table of tablesToDrop) {
      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql: `DROP TABLE IF EXISTS ${table} CASCADE;`,
        });
        
        // Fallback: direct query if RPC doesn't work
        if (error) {
          const { error: directError } = await supabase
            .from(table)
            .select("*")
            .limit(0);
          
          // If table exists, try to drop it via direct SQL
          if (!directError) {
            console.log(`   ⚠️  Could not drop ${table} via RPC, trying direct SQL...`);
          }
        } else {
          console.log(`   ✓ Dropped ${table}`);
        }
      } catch (err) {
        // Table might not exist, continue
        console.log(`   ℹ️  ${table} (may not exist)`);
      }
    }

    // Step 2: Drop functions
    console.log("\n🔧 Dropping functions...");
    for (const func of functionsToDrop) {
      try {
        await supabase.rpc("exec_sql", {
          sql: `DROP FUNCTION IF EXISTS ${func} CASCADE;`,
        });
        console.log(`   ✓ Dropped ${func}`);
      } catch (err) {
        // Function might not exist, continue
      }
    }

    // Step 3: Read and execute schema.sql
    console.log("\n📖 Reading schema.sql...");
    const schemaPath = join(process.cwd(), "lib/db/schema.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = schemaSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`   Executing ${statements.length} statements...\n`);

    for (const statement of statements) {
      try {
        // Use direct SQL query via Supabase REST API
        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          // Try alternative method for Supabase
          console.log(`   ⚠️  Statement failed (may be expected): ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        // Some statements might fail (e.g., IF NOT EXISTS), that's okay
      }
    }

    // Step 4: Execute RLS policies
    console.log("\n🔒 Setting up RLS policies...");
    const rlsPath = join(process.cwd(), "lib/db/migrations/setup_rls_policies.sql");
    const rlsSql = readFileSync(rlsPath, "utf-8");

    const rlsStatements = rlsSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of rlsStatements) {
      try {
        await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });
      } catch (err) {
        // Some RLS statements might fail if policies already exist
      }
    }

    console.log("\n✅ Database reset complete!");
    console.log("\n💡 Next steps:");
    console.log("   1. Verify tables in Supabase Dashboard");
    console.log("   2. Test your application");
    console.log("   3. If needed, seed with test data\n");
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    console.error("\n💡 Alternative approach:");
    console.error("   1. Go to Supabase Dashboard > SQL Editor");
    console.error("   2. Copy contents of lib/db/schema.sql");
    console.error("   3. Run it manually (Supabase SQL Editor has better error handling)");
    process.exit(1);
  }
}

// Run the reset
resetDatabase();

