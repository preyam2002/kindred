#!/bin/bash
# Development Database Reset Script
# 
# This script provides an easy way to reset your database during development.
# It uses the Supabase SQL Editor approach (easiest method).

set -e

echo "🔄 Database Reset Helper"
echo ""
echo "This script will help you reset your database quickly."
echo ""
echo "Choose a method:"
echo "  1) Open Supabase SQL Editor with reset script (recommended)"
echo "  2) Show instructions for manual reset"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
  1)
    echo ""
    echo "📋 Copy the following SQL and run it in Supabase SQL Editor:"
    echo "   Dashboard > SQL Editor > New Query"
    echo ""
    echo "---"
    cat lib/db/migrations/reset-db-simple.sql
    echo ""
    echo "---"
    echo ""
    echo "After running the reset script, run these in order:"
    echo "  1. lib/db/schema.sql"
    echo "  2. lib/db/migrations/setup_rls_policies.sql"
    echo ""
    echo "💡 Tip: Save these as snippets in Supabase for quick access!"
    ;;
  2)
    echo ""
    echo "📖 Manual Reset Instructions:"
    echo ""
    echo "1. Go to Supabase Dashboard > SQL Editor"
    echo "2. Run these files in order:"
    echo "   a) scripts/reset-db-simple.sql (drops all tables)"
    echo "   b) lib/db/schema.sql (creates tables)"
    echo "   c) lib/db/migrations/setup_rls_policies.sql (sets up RLS)"
    echo ""
    echo "Alternatively, you can combine them:"
    echo "   - Copy reset-db-simple.sql"
    echo "   - Copy schema.sql"
    echo "   - Copy setup_rls_policies.sql"
    echo "   - Paste all into SQL Editor and run"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

