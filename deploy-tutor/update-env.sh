#!/bin/bash

# Update Environment File on Remote Server
# This script updates the environment file on the VPS

set -e

echo "🔄 Updating Environment File on Remote Server"
echo "============================================"
echo ""

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
APP_DIR="/var/www/personal-tutor"

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  App Directory: $APP_DIR"
echo ""

# Check if env.remote exists locally
if [ ! -f "client/env.remote" ]; then
    echo "❌ Error: client/env.remote file not found"
    exit 1
fi

echo "📤 Uploading updated environment file..."
scp client/env.remote $VPS_USER@$VPS_HOST:/tmp/env.remote

echo "🔄 Updating environment file on server..."
ssh $VPS_USER@$VPS_HOST << EOF
    # Copy the updated env.remote to the app directory
    cp /tmp/env.remote $APP_DIR/client/env.remote
    
    # Copy env.remote to .env in the client directory
    cp $APP_DIR/client/env.remote $APP_DIR/client/.env
    
    # Clean up temporary file
    rm -f /tmp/env.remote
    
    echo "✅ Environment file updated successfully"
    
    # Show the first few lines to verify (without sensitive data)
    echo "📋 Environment file contents (first 5 lines):"
    head -5 $APP_DIR/client/.env
EOF

echo ""
echo "✅ Environment file updated successfully!"
echo ""
echo "🔄 Restarting application to apply changes..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && pm2 restart personal-tutor"

echo ""
echo "🎉 Environment update completed!"
echo "🌐 Your application should now work with the updated configuration."
echo "" 