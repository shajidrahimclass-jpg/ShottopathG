#!/bin/bash

# Database Migration Script for Shottopath E-commerce Platform
# This script applies all migrations to your Supabase database

echo "=========================================="
echo "Shottopath Database Migration Script"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or use Homebrew (macOS):"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Get the project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📂 Project directory: $SCRIPT_DIR"
echo ""

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Migrations directory not found!"
    echo "Expected: $SCRIPT_DIR/supabase/migrations"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "📊 Found $MIGRATION_COUNT migration files"
echo ""

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "❌ No migration files found!"
    exit 1
fi

# Check if project is linked
echo "🔗 Checking Supabase project link..."
if ! supabase status &> /dev/null; then
    echo ""
    echo "⚠️  Project not linked to Supabase."
    echo ""
    echo "Please link your project first:"
    echo "  supabase link --project-ref rixikhernphntvuwfzcy"
    echo ""
    echo "You'll need your database password from Supabase Dashboard:"
    echo "  Settings → Database → Database password"
    echo ""
    exit 1
fi

echo "✅ Project is linked"
echo ""

# Confirm before proceeding
echo "⚠️  WARNING: This will apply $MIGRATION_COUNT migrations to your database."
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Migration cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting migration process..."
echo ""

# Apply migrations
if supabase db push; then
    echo ""
    echo "=========================================="
    echo "✅ SUCCESS! All migrations applied."
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Create an admin user through your app"
    echo "2. Update the user's role to 'admin' in Supabase Dashboard"
    echo "3. Configure payment gateways in Admin Settings"
    echo "4. Add products and categories"
    echo "5. Test the complete checkout flow"
    echo ""
    echo "See DATABASE_SETUP_GUIDE.md for detailed instructions."
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ FAILED! Migration encountered errors."
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Check your database password is correct"
    echo "2. Verify network connection to Supabase"
    echo "3. Check Supabase Dashboard for error details"
    echo "4. Try applying migrations manually via SQL Editor"
    echo ""
    echo "See DATABASE_SETUP_GUIDE.md for manual migration steps."
    echo ""
    exit 1
fi
