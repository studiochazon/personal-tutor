#!/bin/bash

# Personal Tutor Deployment - Start Services
# This script starts the personal-tutor application using PM2

set -e

echo "🚀 Starting Personal Tutor Services..."

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
APP_DIR="/var/www/personal-tutor"
SERVICE_NAME="personal-tutor"
DOMAIN="tutor.novotio.com"

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  App Directory: $APP_DIR"
echo "  Service Name: $SERVICE_NAME"
echo "  Domain: $DOMAIN"
echo ""

# Check if application directory exists
echo "🔍 Checking application directory..."
ssh $VPS_USER@$VPS_HOST "test -d $APP_DIR" || {
    echo "❌ Application directory not found. Please run deployment scripts first."
    exit 1
}

# Check if build directory exists
echo "🔍 Checking build directory..."
ssh $VPS_USER@$VPS_HOST "test -d $APP_DIR/build" || {
    echo "❌ Build directory not found. Please run deployment scripts first."
    exit 1
}

# Stop existing service if running
echo "🛑 Stopping existing service if running..."
ssh $VPS_USER@$VPS_HOST "pm2 stop $SERVICE_NAME 2>/dev/null || true"
ssh $VPS_USER@$VPS_HOST "pm2 delete $SERVICE_NAME 2>/dev/null || true"

# Start the application
echo "▶️ Starting application with PM2..."
ssh $VPS_USER@$VPS_HOST "cd $APP_DIR && pm2 start ecosystem.config.cjs"

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
ssh $VPS_USER@$VPS_HOST "pm2 save"

# Setup PM2 startup script
echo "🔧 Setting up PM2 startup script..."
ssh $VPS_USER@$VPS_HOST "pm2 startup" || {
    echo "⚠️  PM2 startup command failed, but continuing..."
}

# Check if service is running
echo "🔍 Checking service status..."
sleep 3
SERVICE_STATUS=$(ssh $VPS_USER@$VPS_HOST "pm2 status | grep $SERVICE_NAME || echo 'not_found'")

if [[ $SERVICE_STATUS == *"online"* ]]; then
    echo "✅ Service is running successfully"
else
    echo "❌ Service failed to start"
    echo "📋 Checking logs..."
    ssh $VPS_USER@$VPS_HOST "pm2 logs $SERVICE_NAME --lines 20"
    exit 1
fi

# Check if port is listening
echo "🔍 Checking if port 3001 is listening..."
PORT_STATUS=$(ssh $VPS_USER@$VPS_HOST "netstat -tlnp | grep :3001 || echo 'not_listening'")

if [[ $PORT_STATUS == *"3001"* ]]; then
    echo "✅ Port 3001 is listening"
else
    echo "❌ Port 3001 is not listening"
    exit 1
fi

# Test the application
echo "🧪 Testing application..."
sleep 2
HTTP_STATUS=$(ssh $VPS_USER@$VPS_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 || echo '000'")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Application is responding correctly (HTTP $HTTP_STATUS)"
else
    echo "⚠️  Application responded with HTTP $HTTP_STATUS"
fi

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🌐 Your application is now available at:"
echo "   HTTP:  http://$DOMAIN"
echo "   HTTPS: https://$DOMAIN"
echo ""
echo "📋 Useful commands:"
echo "   View logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs $SERVICE_NAME'"
echo "   Restart:  ssh $VPS_USER@$VPS_HOST 'pm2 restart $SERVICE_NAME'"
echo "   Stop:     ssh $VPS_USER@$VPS_HOST 'pm2 stop $SERVICE_NAME'"
echo "   Status:   ssh $VPS_USER@$VPS_HOST 'pm2 status'"
echo ""
echo "🎉 Deployment completed successfully!"
echo "" 