#!/bin/bash

# Deploy Personal Tutor App to VPS
# This script builds and deploys the application to the VPS

set -e

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
APP_DIR="/var/www/personal-tutor"
REPO_URL="https://github.com/essekia/personal-tutor.git"
BRANCH="release/v0"

echo "🚀 Starting Personal Tutor App Deployment"
echo "📍 Target: $VPS_HOST"
echo "📁 App Directory: $APP_DIR"
echo "🌿 Branch: $BRANCH"
echo ""

# Check if we're in the right directory
if [ ! -d "client" ]; then
    echo "❌ Error: client directory not found. Please run this script from the personal-tutor project root."
    exit 1
fi

# Deploy to server
echo "📤 Deploying to server..."
echo "🔄 Pulling latest code from GitHub..."

# SSH into server and pull latest code
ssh $VPS_USER@$VPS_HOST << EOF
    # Create app directory if it doesn't exist
    mkdir -p $APP_DIR
    
    # Navigate to app directory
    cd $APP_DIR
    
    # Check if git repository exists
    if [ ! -d ".git" ]; then
        echo "📥 Cloning repository..."
        git clone $REPO_URL .
    else
        echo "🔄 Fetching latest changes..."
        git fetch origin
    fi
    
    # Checkout the specified branch
    echo "🌿 Checking out $BRANCH..."
    git checkout $BRANCH
    git pull origin $BRANCH
    
    # Navigate to client directory and install dependencies
    echo "📦 Installing dependencies..."
    cd client
    npm install
    
    # Clean previous build
    echo "🧹 Cleaning previous build..."
    rm -rf build/
    
    # Build for production
    echo "🏗️ Building for production..."
    npm run build:production
    
    # Copy environment file
    echo "📋 Setting up environment..."
    if [ -f "env.remote" ]; then
        cp env.remote .env
        echo "✅ Environment file copied from env.remote to .env"
    else
        echo "❌ env.remote file not found. Please ensure it exists with proper configuration."
        exit 1
    fi
    
    # Install production dependencies
    echo "📦 Installing production dependencies..."
    npm install --production
    
    # Ensure the build directory is accessible to nginx
    echo "🔧 Setting up build directory permissions..."
    chmod -R 755 build/
    chown -R root:root build/
    
    echo "✅ Build completed successfully"
EOF

echo ""
echo "✅ App deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: ./deploy-tutor/03-configure-nginx.sh"
echo "  2. Run: ./deploy-tutor/05-start-services.sh"
echo "" 