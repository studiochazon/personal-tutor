#!/bin/bash

# Personal Tutor Database Management
# This script provides database management functions for the remote server

set -e

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
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

# Function to show usage
show_usage() {
    echo "🗄️ Personal Tutor Database Management"
    echo "====================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Set up database (install MySQL, create DB, run schema)"
    echo "  migrate   - Run all pending migrations"
    echo "  reset     - Reset database (drop and recreate)"
    echo "  backup    - Create database backup"
    echo "  restore   - Restore database from backup"
    echo "  status    - Show database status"
    echo "  logs      - Show MySQL logs"
    echo "  connect   - Connect to database via SSH"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 migrate"
    echo "  $0 backup"
    echo ""
}

# Function to check SSH connection
check_ssh() {
    echo "🔍 Testing SSH connection..."
    ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" || {
        echo "❌ Failed to connect to VPS. Please check your SSH credentials."
        exit 1
    }
    echo "✅ SSH connection successful"
}

# Function to setup database
setup_database() {
    echo "🗄️ Setting up database..."
    check_ssh
    
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
    
    # Create database and user (using root with password for database creation)
    echo "🗄️ Creating database and user..."
    ssh $VPS_USER@$VPS_HOST "mysql -u root -pqLnoF8dAbhN6Us78 -e \"CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
    ssh $VPS_USER@$VPS_HOST "mysql -u root -pqLnoF8dAbhN6Us78 -e \"CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';\""
    ssh $VPS_USER@$VPS_HOST "mysql -u root -pqLnoF8dAbhN6Us78 -e \"GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';\""
    ssh $VPS_USER@$VPS_HOST "mysql -u root -pqLnoF8dAbhN6Us78 -e \"FLUSH PRIVILEGES;\""
    
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
}

# Function to run migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    check_ssh
    
    # Copy migration files to server
    echo "📁 Copying migration files to server..."
    ssh $VPS_USER@$VPS_HOST "mkdir -p /tmp/migrations"
    scp database-migrations/*.sql $VPS_USER@$VPS_HOST:/tmp/migrations/
    
    # Get database password from environment file
    DB_PASSWORD=$(ssh $VPS_USER@$VPS_HOST "grep DB_PASSWORD $APP_DIR/.env.database | cut -d'=' -f2" 2>/dev/null || echo "")
    
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ Database password not found. Please run setup first."
        exit 1
    fi
    
    # Run migrations
    echo "🔄 Running database migrations..."
    ssh $VPS_USER@$VPS_HOST "for file in /tmp/migrations/*.sql; do echo \"Running migration: \$file\"; mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < \"\$file\"; done"
    
    # Clean up temporary files
    echo "🧹 Cleaning up temporary files..."
    ssh $VPS_USER@$VPS_HOST "rm -rf /tmp/migrations"
    
    echo "✅ Migrations completed successfully!"
}

# Function to reset database
reset_database() {
    echo "🔄 Resetting database..."
    check_ssh
    
    # Get database password from environment file
    DB_PASSWORD=$(ssh $VPS_USER@$VPS_HOST "grep DB_PASSWORD $APP_DIR/.env.database | cut -d'=' -f2" 2>/dev/null || echo "")
    
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ Database password not found. Please run setup first."
        exit 1
    fi
    
    # Drop and recreate database
    echo "🗑️ Dropping and recreating database..."
    ssh $VPS_USER@$VPS_HOST "mysql -u $DB_USER -p$DB_PASSWORD -e \"DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
    
    # Copy schema file to server
    echo "📁 Copying schema file to server..."
    scp database/schema.sql $VPS_USER@$VPS_HOST:/tmp/schema.sql
    
    # Run schema setup
    echo "🔧 Setting up database schema..."
    ssh $VPS_USER@$VPS_HOST "mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < /tmp/schema.sql"
    
    # Clean up temporary files
    echo "🧹 Cleaning up temporary files..."
    ssh $VPS_USER@$VPS_HOST "rm -f /tmp/schema.sql"
    
    echo "✅ Database reset completed successfully!"
}

# Function to backup database
backup_database() {
    echo "💾 Creating database backup..."
    check_ssh
    
    # Get database password from environment file
    DB_PASSWORD=$(ssh $VPS_USER@$VPS_HOST "grep DB_PASSWORD $APP_DIR/.env.database | cut -d'=' -f2" 2>/dev/null || echo "")
    
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ Database password not found. Please run setup first."
        exit 1
    fi
    
    # Create backup directory
    BACKUP_DIR="/var/backups/personal-tutor"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    echo "📁 Creating backup: $BACKUP_FILE"
    ssh $VPS_USER@$VPS_HOST "mkdir -p $BACKUP_DIR"
    ssh $VPS_USER@$VPS_HOST "mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/$BACKUP_FILE"
    
    echo "✅ Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"
}

# Function to restore database
restore_database() {
    if [ -z "$1" ]; then
        echo "❌ Please specify backup file to restore"
        echo "Usage: $0 restore <backup-file>"
        exit 1
    fi
    
    echo "🔄 Restoring database from backup: $1"
    check_ssh
    
    # Get database password from environment file
    DB_PASSWORD=$(ssh $VPS_USER@$VPS_HOST "grep DB_PASSWORD $APP_DIR/.env.database | cut -d'=' -f2" 2>/dev/null || echo "")
    
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ Database password not found. Please run setup first."
        exit 1
    fi
    
    # Restore database
    echo "🔄 Restoring database..."
    ssh $VPS_USER@$VPS_HOST "mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < $1"
    
    echo "✅ Database restored successfully!"
}

# Function to show database status
show_status() {
    echo "📊 Database Status"
    echo "================="
    check_ssh
    
    # Check MySQL status
    echo "🔍 MySQL Service Status:"
    ssh $VPS_USER@$VPS_HOST "systemctl status mysql --no-pager -l"
    
    # Check database size
    echo ""
    echo "📊 Database Size:"
    ssh $VPS_USER@$VPS_HOST "mysql -e \"SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = '$DB_NAME' GROUP BY table_schema;\""
    
    # Check table counts
    echo ""
    echo "📋 Table Information:"
    ssh $VPS_USER@$VPS_HOST "mysql -e \"SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = '$DB_NAME' ORDER BY table_name;\""
}

# Function to show MySQL logs
show_logs() {
    echo "📋 MySQL Logs"
    echo "============="
    check_ssh
    
    ssh $VPS_USER@$VPS_HOST "tail -n 50 /var/log/mysql/error.log"
}

# Function to connect to database
connect_database() {
    echo "🔌 Connecting to database..."
    check_ssh
    
    ssh -t $VPS_USER@$VPS_HOST "mysql -u $DB_USER -p $DB_NAME"
}

# Main script logic
case "$1" in
    setup)
        setup_database
        ;;
    migrate)
        run_migrations
        ;;
    reset)
        reset_database
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    connect)
        connect_database
        ;;
    *)
        show_usage
        exit 1
        ;;
esac 