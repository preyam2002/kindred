#!/usr/bin/env tsx
/**
 * Execute Complete Database Reset via Supabase
 * 
 * This script attempts to execute the complete database reset SQL.
 * It requires either:
 * 1. A custom exec_sql RPC function in Supabase, OR
 * 2. Direct PostgreSQL connection (not available via Supabase JS client)
 * 
 * Usage:
 *   tsx scripts/execute-sql-reset.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load environment variables from .env files
function loadEnvFile(filePath: string) {
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile(join(process.cwd(), ".env.local"));
loadEnvFile(join(process.cwd(), ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQLStatement(sql: string): Promise<boolean> {
  try {
    // Try using a custom exec_sql RPC function (if it exists)
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      // Try alternative parameter name
      const { error: error2 } = await supabase.rpc('exec_sql', { 
        sql: sql 
      });
      
      if (error2) {
        console.error(`   ⚠️  RPC error: ${error2.message}`);
        return false;
      }
    }
    
    return true;
  } catch (err: any) {
    console.error(`   ⚠️  Error: ${err.message}`);
    return false;
  }
}

async function resetDatabase() {
  console.log("🔄 Starting complete database reset...\n");

  try {
    // First, check if exec_sql function exists
    console.log("🔍 Checking for exec_sql RPC function...");
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'exec_sql')
      .limit(1);

    if (funcError || !functions || functions.length === 0) {
      console.log("   ⚠️  exec_sql RPC function not found.");
      console.log("\n📋 To enable programmatic SQL execution, create this function in Supabase:");
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
      `);
      console.log("\n💡 Alternative: Run the SQL file manually in Supabase SQL Editor:");
      console.log("   1. Open Supabase Dashboard > SQL Editor > New Query");
      console.log("   2. Copy contents of scripts/reset-db-complete.sql");
      console.log("   3. Paste and click Run\n");
      return;
    }

    console.log("   ✓ exec_sql function found!\n");

    // Read the SQL file
    const sqlPath = join(process.cwd(), "scripts/reset-db-complete.sql");
    console.log(`📖 Reading ${sqlPath}...`);
    const sql = readFileSync(sqlPath, "utf-8");

    // Split into statements (basic approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))
      .filter(s => !s.match(/^\s*$/));

    console.log(`   Found ${statements.length} SQL statements\n`);

    // Execute each statement
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip very short or empty statements
      if (statement.length < 10) continue;

      // Skip DO blocks and other complex statements that need special handling
      if (statement.toUpperCase().includes('DO $$')) continue;

      try {
        const success = await executeSQLStatement(statement + ';');
        if (success) {
          successCount++;
          if ((i + 1) % 10 === 0) {
            process.stdout.write(`   Progress: ${i + 1}/${statements.length} statements\r`);
          }
        } else {
          failCount++;
        }
      } catch (err: any) {
        failCount++;
        // Some errors are expected (e.g., IF NOT EXISTS)
        if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
          console.error(`\n   ⚠️  Statement ${i + 1} failed: ${err.message.substring(0, 100)}`);
        }
      }
    }

    console.log(`\n\n✅ Execution complete!`);
    console.log(`   ✓ Successful: ${successCount}`);
    console.log(`   ⚠️  Failed: ${failCount}`);
    console.log("\n💡 Next steps:");
    console.log("   1. Verify tables in Supabase Dashboard");
    console.log("   2. Check for any errors in the output above");
    console.log("   3. Test your application\n");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\n💡 Please run the SQL file manually in Supabase SQL Editor:");
    console.error("   Dashboard > SQL Editor > New Query > Paste SQL > Run\n");
    process.exit(1);
  }
}

resetDatabase();

