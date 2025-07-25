#!/bin/bash

# Personal Tutor Deployment - Cleanup Script
# This script removes the personal-tutor deployment from the server

set -e

echo "🧹 Personal Tutor Deployment Cleanup"
echo "==================================="
echo ""

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
DOMAIN="tutor.novotio.com"
APP_DIR="/var/www/personal-tutor"
SERVICE_NAME="personal-tutor"

echo "📋 Cleanup Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Ask for confirmation
echo "⚠️  This will completely remove the personal-tutor deployment:"
echo "   - Stop and remove PM2 service"
echo "   - Remove application files"
echo "   - Remove nginx configuration"
echo "   - Remove SSL certificate"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo "🧹 Starting cleanup process..."
echo ""

# Step 1: Stop and remove PM2 service
echo "📋 Step 1/4: Stopping PM2 service..."
ssh $VPS_USER@$VPS_HOST "pm2 stop $SERVICE_NAME 2>/dev/null || true"
ssh $VPS_USER@$VPS_HOST "pm2 delete $SERVICE_NAME 2>/dev/null || true"
ssh $VPS_USER@$VPS_HOST "pm2 save 2>/dev/null || true"
echo "✅ PM2 service removed"
echo ""

# Step 2: Remove application files
echo "📋 Step 2/4: Removing application files..."
ssh $VPS_USER@$VPS_HOST "rm -rf $APP_DIR"
echo "✅ Application files removed"
echo ""

# Step 3: Remove nginx configuration
echo "📋 Step 3/4: Removing nginx configuration..."
ssh $VPS_USER@$VPS_HOST "rm -f /etc/nginx/sites-enabled/tutor.novotio.conf"
ssh $VPS_USER@$VPS_HOST "rm -f /etc/nginx/sites-available/tutor.novotio.conf"
echo "✅ Nginx configuration removed"
echo ""

# Step 4: Remove SSL certificate
echo "📋 Step 4/4: Removing SSL certificate..."
ssh $VPS_USER@$VPS_HOST "certbot delete --cert-name $DOMAIN --non-interactive 2>/dev/null || true"
echo "✅ SSL certificate removed"
echo ""

# Reload nginx
echo "🔄 Reloading nginx..."
ssh $VPS_USER@$VPS_HOST "nginx -t && systemctl reload nginx" || {
    echo "⚠️  Nginx reload failed, but continuing..."
}

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "📋 What was removed:"
echo "   - PM2 service: $SERVICE_NAME"
echo "   - Application directory: $APP_DIR"
echo "   - Nginx configuration: tutor.novotio.conf"
echo "   - SSL certificate for: $DOMAIN"
echo ""
echo "🌐 The domain $DOMAIN is no longer accessible"
echo "" 