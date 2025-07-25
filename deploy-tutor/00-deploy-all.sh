#!/bin/bash

# Personal Tutor Deployment - Master Script
# This script runs all deployment steps in sequence

set -e

echo "🚀 Personal Tutor - Complete Deployment"
echo "======================================"
echo ""

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
DOMAIN="tutor.novotio.com"

echo "📋 Deployment Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  Domain: $DOMAIN"
echo "  Application: Personal Tutor"
echo ""

# Check if we're in the right directory
if [ ! -d "client" ]; then
    echo "❌ Error: client directory not found. Please run this script from the personal-tutor project root."
    exit 1
fi

# Check if all deployment scripts exist
echo "🔍 Checking deployment scripts..."
for script in 01-setup-server.sh 02-deploy-app.sh 03-configure-nginx.sh 04-setup-ssl.sh 05-start-services.sh; do
    if [ ! -f "deploy-tutor/$script" ]; then
        echo "❌ Error: deploy-tutor/$script not found"
        exit 1
    fi
done

echo "✅ All deployment scripts found"
echo ""

# Ask for confirmation
echo "⚠️  This will deploy the personal-tutor application to $DOMAIN"
echo "   Make sure you have:"
echo "   - DNS configured for $DOMAIN pointing to $VPS_HOST"
echo "   - SSH access to the VPS"
echo "   - All necessary environment variables configured"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting deployment process..."
echo ""

# Step 1: Server Setup
echo "📋 Step 1/5: Server Setup"
echo "------------------------"
chmod +x deploy-tutor/01-setup-server.sh
./deploy-tutor/01-setup-server.sh
echo ""

# Step 2: App Deployment
echo "📋 Step 2/5: App Deployment"
echo "---------------------------"
chmod +x deploy-tutor/02-deploy-app.sh
./deploy-tutor/02-deploy-app.sh
echo ""

# Step 3: Nginx Configuration
echo "📋 Step 3/5: Nginx Configuration"
echo "-------------------------------"
chmod +x deploy-tutor/03-configure-nginx.sh
./deploy-tutor/03-configure-nginx.sh
echo ""

# Step 4: SSL Setup
echo "📋 Step 4/5: SSL Setup"
echo "---------------------"
chmod +x deploy-tutor/04-setup-ssl.sh
./deploy-tutor/04-setup-ssl.sh
echo ""

# Step 5: Start Services
echo "📋 Step 5/5: Start Services"
echo "--------------------------"
chmod +x deploy-tutor/05-start-services.sh
./deploy-tutor/05-start-services.sh
echo ""

echo "🎉 Deployment completed successfully!"
echo ""
echo "🌐 Your Personal Tutor application is now live at:"
echo "   https://$DOMAIN"
echo ""
echo "📋 Useful commands:"
echo "   View logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs personal-tutor'"
echo "   Restart:  ssh $VPS_USER@$VPS_HOST 'pm2 restart personal-tutor'"
echo "   Status:   ssh $VPS_USER@$VPS_HOST 'pm2 status'"
echo ""
echo "🔧 To update the application in the future, run:"
echo "   ./deploy-tutor/02-deploy-app.sh && ./deploy-tutor/05-start-services.sh"
echo "" 