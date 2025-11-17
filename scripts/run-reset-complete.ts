#!/usr/bin/env tsx
/**
 * Complete Database Reset Script Runner
 * 
 * This script executes the complete database reset SQL file.
 * WARNING: This will DELETE ALL DATA. Only use in development!
 * 
 * Usage:
 *   npm run db:reset-complete
 * 
 * Or directly:
 *   tsx scripts/run-reset-complete.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY (required for admin operations)");
  console.error("\n💡 Get your service role key from:");
  console.error("   Supabase Dashboard > Project Settings > API > service_role key");
  console.error("\n📋 Alternative: Run the SQL file directly in Supabase SQL Editor:");
  console.error("   1. Open Supabase Dashboard > SQL Editor");
  console.error("   2. Copy contents of scripts/reset-db-complete.sql");
  console.error("   3. Paste and click Run");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql: string): Promise<boolean> {
  // Supabase doesn't have a direct SQL execution endpoint via the JS client
  // We need to use the REST API directly or use psql/Supabase CLI
  // For now, we'll try to use the REST API with the service role key
  
  try {
    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      // If exec_sql doesn't exist, we can't execute SQL programmatically
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function resetDatabase() {
  console.log("🔄 Starting complete database reset...\n");

  try {
    // Read the complete reset SQL file
    const sqlPath = join(process.cwd(), "scripts/reset-db-complete.sql");
    console.log(`📖 Reading ${sqlPath}...`);
    const sql = readFileSync(sqlPath, "utf-8");

    console.log("\n⚠️  WARNING: Supabase JS client doesn't support direct SQL execution.");
    console.log("   The recommended way is to run SQL in Supabase SQL Editor.\n");
    console.log("📋 To reset your database:");
    console.log("   1. Open Supabase Dashboard > SQL Editor > New Query");
    console.log("   2. Copy the contents of scripts/reset-db-complete.sql");
    console.log("   3. Paste into SQL Editor");
    console.log("   4. Click 'Run' or press Cmd/Ctrl + Enter\n");

    // Try to check if we can use Supabase CLI
    const { execSync } = require('child_process');
    try {
      execSync('which supabase', { stdio: 'ignore' });
      console.log("💡 Alternative: If you have Supabase CLI installed, you can run:");
      console.log(`   supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"`);
      console.log("   Then run: psql [CONNECTION-STRING] < scripts/reset-db-complete.sql\n");
    } catch {
      // Supabase CLI not installed
    }

    // Try to execute via REST API (may not work)
    console.log("🔄 Attempting to execute SQL via REST API...");
    const success = await executeSQL(sql);
    
    if (!success) {
      console.log("   ⚠️  Direct SQL execution not available.");
      console.log("   Please use Supabase SQL Editor as described above.\n");
      process.exit(0);
    }

    console.log("✅ Database reset complete!");
    console.log("\n💡 Next steps:");
    console.log("   1. Verify tables in Supabase Dashboard");
    console.log("   2. Test your application");
    console.log("   3. If needed, seed with test data\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    console.error("\n💡 Please run the SQL file manually in Supabase SQL Editor:");
    console.error("   Dashboard > SQL Editor > New Query > Paste SQL > Run\n");
    process.exit(1);
  }
}

// Run the reset
resetDatabase();

