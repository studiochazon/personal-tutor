#!/bin/bash

echo "🔐 Setting up Google Identity Services Authentication"
echo "=================================================="

# Check if MySQL is running
if ! mysqladmin ping -h localhost --silent; then
    echo "❌ MySQL is not running. Please start MySQL first."
    exit 1
fi

echo "✅ MySQL is running"

# Create .env file if it doesn't exist
if [ ! -f "client/.env" ]; then
    echo "📝 Creating .env file..."
    cat > client/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345678
DB_NAME=personal_tutor_ai
DB_PORT=3306

# JWT Secret (generate a secure random string)
JWT_SECRET=$(openssl rand -base64 32)

# Google Identity Services
GOOGLE_CLIENT_ID=98375891181-n3p0te6cavre6972u795scah5gabctse.apps.googleusercontent.com

# Application Configuration
BASE_URL=http://localhost:5173
EOF
    echo "✅ Created client/.env file"
else
    echo "ℹ️  .env file already exists"
fi

# Run database migration
echo "🗄️  Running database migration..."
mysql -u root -p12345678 personal_tutor_ai < database/schema-update-auth.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed"
else
    echo "❌ Database migration failed"
    exit 1
fi

echo ""
echo "🎉 Authentication setup completed!"
echo ""
echo "Next steps:"
echo "1. Start the development server: cd client && npm run dev"
echo "2. Visit http://localhost:5173/auth/login"
echo "3. Test the Google Sign-In functionality"
echo ""
echo "Note: Make sure your Google OAuth credentials are properly configured"
echo "in the Google Cloud Console with the correct redirect URIs." 