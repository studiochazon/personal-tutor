#!/bin/bash

# Personal Tutor Deployment - Database Setup
# This script sets up MySQL database on the remote server

set -e

echo "🗄️ Starting Personal Tutor Database Setup..."

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
DOMAIN="tutor.novotio.com"
APP_DIR="/var/www/personal-tutor"

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
    echo "❌ env.remote file not found. Using default values."
    DB_NAME="personal_tutor"
    DB_USER="novotio_admin"
    DB_PASSWORD="1991@RootOmega"
    DB_HOST="127.0.0.1"
    DB_PORT="3306"
fi

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  Database: $DB_NAME"
echo "  Database User: $DB_USER"
echo "  Database Host: $DB_HOST"
echo "  Database Port: $DB_PORT"
echo ""

# Check if we can connect to the server
echo "🔍 Testing SSH connection..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" || {
    echo "❌ Failed to connect to VPS. Please check your SSH credentials."
    exit 1
}

echo "✅ SSH connection successful"
echo ""

# Check if MySQL is installed
echo "🔍 Checking MySQL installation..."
MYSQL_VERSION=$(ssh $VPS_USER@$VPS_HOST "mysql --version 2>/dev/null || echo 'not_installed'")
if [ "$MYSQL_VERSION" = "not_installed" ]; then
    echo "📦 Installing MySQL..."
    ssh $VPS_USER@$VPS_HOST "apt-get update && apt-get install -y mysql-server"
    
    # Secure MySQL installation
    echo "🔒 Securing MySQL installation..."
    ssh $VPS_USER@$VPS_HOST "mysql_secure_installation --use-default"
else
    echo "✅ MySQL already installed: $MYSQL_VERSION"
fi

# Create database and user (using existing credentials from env.remote)
echo "🗄️ Creating database and user..."
ssh $VPS_USER@$VPS_HOST "mysql -e \"CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
ssh $VPS_USER@$VPS_HOST "mysql -e \"CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';\""
ssh $VPS_USER@$VPS_HOST "mysql -e \"GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';\""
ssh $VPS_USER@$VPS_HOST "mysql -e \"FLUSH PRIVILEGES;\""

echo "✅ Database and user created successfully"

# Copy schema file to server
echo "📁 Copying schema file to server..."
scp database/schema.sql $VPS_USER@$VPS_HOST:/tmp/schema.sql

# Run schema setup
echo "🔧 Setting up database schema..."
ssh $VPS_USER@$VPS_HOST "mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < /tmp/schema.sql"

# Copy migration files to server
echo "📁 Copying migration files to server..."
ssh $VPS_USER@$VPS_HOST "mkdir -p /tmp/migrations"
scp database-migrations/*.sql $VPS_USER@$VPS_HOST:/tmp/migrations/

# Run migrations
echo "🔄 Running database migrations..."
ssh $VPS_USER@$VPS_HOST "for file in /tmp/migrations/*.sql; do echo \"Running migration: \$file\"; mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < \"\$file\"; done"

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
ssh $VPS_USER@$VPS_HOST "rm -f /tmp/schema.sql && rm -rf /tmp/migrations"

# Create environment file with database credentials (using env.remote values)
echo "📝 Creating database environment file..."
ssh $VPS_USER@$VPS_HOST "cat > $APP_DIR/.env.database << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF"

echo ""
echo "✅ Database setup completed successfully!"
echo ""
echo "📋 Database Information:"
echo "  Database Name: $DB_NAME"
echo "  Database User: $DB_USER"
echo "  Database Password: $DB_PASSWORD"
echo "  Database Host: $DB_HOST"
echo "  Database Port: $DB_PORT"
echo ""
echo "📁 Database credentials saved to: $APP_DIR/.env.database"
echo ""
echo "📋 Next steps:"
echo "  1. Update your application's environment variables with the database credentials"
echo "  2. Run: ./deploy-tutor/02-deploy-app.sh"
echo "  3. Run: ./deploy-tutor/03-configure-nginx.sh"
echo "  4. Run: ./deploy-tutor/04-setup-ssl.sh"
echo "  5. Run: ./deploy-tutor/05-start-services.sh"
echo "" 