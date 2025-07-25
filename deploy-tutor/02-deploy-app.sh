#!/bin/bash

# Personal Tutor Deployment - App Deployment
# This script builds and deploys the personal-tutor application

set -e

echo "🚀 Starting Personal Tutor App Deployment..."

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
APP_DIR="/var/www/personal-tutor"
SERVICE_NAME="personal-tutor"

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  App Directory: $APP_DIR"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Check if we're in the right directory
if [ ! -d "client" ]; then
    echo "❌ Error: client directory not found. Please run this script from the personal-tutor project root."
    exit 1
fi

# Build the application locally
echo "🔨 Building application locally..."
echo "📦 Installing dependencies..."
cd client
npm install

echo "🏗️ Building for production..."
npm run build:production
cd ..

# Check if build was successful
if [ ! -d "client/build" ]; then
    echo "❌ Build failed. client/build directory not found."
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
DEPLOY_DIR="deploy-tutor/temp-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
echo "📋 Copying files to deployment package..."
cp -r client/build $DEPLOY_DIR/
cp -r client/static $DEPLOY_DIR/ 2>/dev/null || echo "No static directory found"
cp client/package.json $DEPLOY_DIR/
cp client/package-lock.json $DEPLOY_DIR/
cp client/env.remote $DEPLOY_DIR/.env 2>/dev/null || echo "No env.remote file found"
cp ecosystem.config.cjs $DEPLOY_DIR/ 2>/dev/null || echo "No ecosystem.config.cjs found"

# Create ecosystem.config.cjs if it doesn't exist
if [ ! -f "ecosystem.config.cjs" ]; then
    echo "📝 Creating PM2 ecosystem configuration..."
    cat > $DEPLOY_DIR/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'personal-tutor',
      script: 'build/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF
fi

# Create logs directory
mkdir -p $DEPLOY_DIR/logs

echo "✅ Deployment package created"
echo ""

# Upload to server
echo "📤 Uploading to server..."
ssh $VPS_USER@$VPS_HOST "rm -rf $APP_DIR/*"
scp -r $DEPLOY_DIR/* $VPS_USER@$VPS_HOST:$APP_DIR/

echo "✅ Files uploaded successfully"
echo ""

# Install dependencies on server
echo "📦 Installing dependencies on server..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && npm install --production"

echo "✅ Dependencies installed"
echo ""

# Clean up local deployment package
echo "🧹 Cleaning up local deployment package..."
rm -rf $DEPLOY_DIR

echo ""
echo "✅ App deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: ./deploy-tutor/03-configure-nginx.sh"
echo "  2. Run: ./deploy-tutor/04-setup-ssl.sh"
echo "  3. Run: ./deploy-tutor/05-start-services.sh"
echo "" 