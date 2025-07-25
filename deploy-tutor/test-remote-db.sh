#!/bin/bash

# Test Remote Database Connection
# This script tests the database connection using credentials from env.remote

set -e

echo "🔍 Testing Remote Database Connection"
echo "===================================="
echo ""

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"

# Load database configuration from env.remote
if [ -f "client/env.remote" ]; then
    echo "📋 Loading database configuration from env.remote..."
    source <(grep -E '^DB_' client/env.remote | sed 's/^/export /')
    DB_NAME="${DB_NAME:-personal_tutor}"
    DB_USER="${DB_USER:-novotio_admin}"
    DB_PASSWORD="${DB_PASSWORD:-1991@RootOmega}"
    DB_HOST="${DB_HOST:-127.0.0.1}"
    DB_PORT="${DB_PORT:-3306}"
else
    echo "❌ env.remote file not found."
    exit 1
fi

echo "📋 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test SSH connection
echo "🔍 Testing SSH connection..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" || {
    echo "❌ Failed to connect to VPS. Please check your SSH credentials."
    exit 1
}

echo "✅ SSH connection successful"
echo ""

# Test MySQL connection
echo "🔍 Testing MySQL connection..."
ssh $VPS_USER@$VPS_HOST "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e 'SELECT 1 as test;'" || {
    echo "❌ Failed to connect to MySQL database."
    echo "   Please check:"
    echo "   - MySQL is running on the server"
    echo "   - Database credentials are correct"
    echo "   - Database and user exist"
    exit 1
}

echo "✅ MySQL connection successful"
echo ""

# Test database access
echo "🔍 Testing database access..."
ssh $VPS_USER@$VPS_HOST "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e 'USE $DB_NAME; SHOW TABLES;'" || {
    echo "❌ Failed to access database $DB_NAME."
    echo "   Please check:"
    echo "   - Database exists"
    echo "   - User has proper permissions"
    exit 1
}

echo "✅ Database access successful"
echo ""

# Show database information
echo "📊 Database Information:"
ssh $VPS_USER@$VPS_HOST "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e \"SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = '$DB_NAME' GROUP BY table_schema;\""

echo ""
echo "📋 Table Information:"
ssh $VPS_USER@$VPS_HOST "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e \"SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = '$DB_NAME' ORDER BY table_name;\""

echo ""
echo "✅ Remote database connection test completed successfully!"
echo ""
echo "🌐 Your database is ready for the Personal Tutor application!" 