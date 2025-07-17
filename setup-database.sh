#!/bin/bash

# Personal Tutor AI Database Setup Script

echo "🚀 Setting up Personal Tutor AI Database..."

# Database configuration
DB_NAME="personal_tutor_ai"
DB_USER="root"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="3306"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if MySQL is running
echo "Checking MySQL connection..."
if ! mysql -u"$DB_USER" -h"$DB_HOST" -P"$DB_PORT" -e "SELECT 1;" >/dev/null 2>&1; then
    print_error "MySQL is not running or connection failed. Please start MySQL and try again."
    exit 1
fi
print_status "MySQL connection successful"

# Create database if it doesn't exist
echo "Creating database..."
mysql -u"$DB_USER" -h"$DB_HOST" -P"$DB_PORT" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
print_status "Database '$DB_NAME' ready"

# Run schema file
echo "Setting up tables and sample data..."
if [ -f "database/schema.sql" ]; then
    mysql -u"$DB_USER" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" < database/schema.sql
    print_status "Schema and sample data loaded successfully"
else
    print_error "Schema file not found at database/schema.sql"
    exit 1
fi

# Verify setup
echo "Verifying setup..."
COURSE_COUNT=$(mysql -u"$DB_USER" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -s -N -e "SELECT COUNT(*) FROM courses;")
USER_COUNT=$(mysql -u"$DB_USER" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -s -N -e "SELECT COUNT(*) FROM users;")
LESSON_COUNT=$(mysql -u"$DB_USER" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" -s -N -e "SELECT COUNT(*) FROM lessons;")

print_status "Database setup complete!"
echo "📊 Database Statistics:"
echo "   - Users: $USER_COUNT"
echo "   - Courses: $COURSE_COUNT"
echo "   - Lessons: $LESSON_COUNT"

echo ""
print_status "Next steps:"
echo "1. Update database configuration in src/lib/config.ts if needed"
echo "2. Start the development server: yarn dev"
echo "3. Visit http://localhost:5173 to see your application"

echo ""
print_warning "Note: Make sure your MySQL server is running and accessible with the configured credentials." 