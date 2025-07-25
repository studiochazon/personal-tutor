#!/bin/bash

# Personal Tutor Deployment - Server Setup
# This script prepares the VPS for personal-tutor deployment

set -e

echo "🚀 Starting Personal Tutor Server Setup..."

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
DOMAIN="tutor.novotio.com"
APP_DIR="/var/www/personal-tutor"
SERVICE_NAME="personal-tutor"

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Check if we can connect to the server
echo "🔍 Testing SSH connection..."
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" || {
    echo "❌ Failed to connect to VPS. Please check your SSH credentials."
    exit 1
}

echo "✅ SSH connection successful"
echo ""

# Create application directory
echo "📁 Creating application directory..."
ssh $VPS_USER@$VPS_HOST "mkdir -p $APP_DIR"

# Check if Node.js is installed
echo "🔍 Checking Node.js installation..."
NODE_VERSION=$(ssh $VPS_USER@$VPS_HOST "node --version 2>/dev/null || echo 'not_installed'")
if [ "$NODE_VERSION" = "not_installed" ]; then
    echo "📦 Installing Node.js..."
    ssh $VPS_USER@$VPS_HOST "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && apt-get install -y nodejs"
else
    echo "✅ Node.js already installed: $NODE_VERSION"
fi

# Check if PM2 is installed
echo "🔍 Checking PM2 installation..."
PM2_VERSION=$(ssh $VPS_USER@$VPS_HOST "pm2 --version 2>/dev/null || echo 'not_installed'")
if [ "$PM2_VERSION" = "not_installed" ]; then
    echo "📦 Installing PM2..."
    ssh $VPS_USER@$VPS_HOST "npm install -g pm2"
else
    echo "✅ PM2 already installed: $PM2_VERSION"
fi

# Check if nginx is installed
echo "🔍 Checking nginx installation..."
NGINX_VERSION=$(ssh $VPS_USER@$VPS_HOST "nginx -v 2>&1 || echo 'not_installed'")
if [ "$NGINX_VERSION" = "not_installed" ]; then
    echo "📦 Installing nginx..."
    ssh $VPS_USER@$VPS_HOST "apt-get update && apt-get install -y nginx"
else
    echo "✅ nginx already installed: $NGINX_VERSION"
fi

# Check if certbot is installed
echo "🔍 Checking certbot installation..."
CERTBOT_VERSION=$(ssh $VPS_USER@$VPS_HOST "certbot --version 2>/dev/null || echo 'not_installed'")
if [ "$CERTBOT_VERSION" = "not_installed" ]; then
    echo "📦 Installing certbot..."
    ssh $VPS_USER@$VPS_HOST "apt-get install -y certbot python3-certbot-nginx"
else
    echo "✅ certbot already installed: $CERTBOT_VERSION"
fi

echo ""
echo "✅ Server setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: ./deploy-tutor/02-deploy-app.sh"
echo "  2. Run: ./deploy-tutor/03-configure-nginx.sh"
echo "  3. Run: ./deploy-tutor/04-setup-ssl.sh"
echo "  4. Run: ./deploy-tutor/05-start-services.sh"
echo "" 