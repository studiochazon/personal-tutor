#!/bin/bash

# Personal Tutor Deployment - SSL Setup
# This script sets up SSL certificate for tutor.novotio.com

set -e

echo "🚀 Starting Personal Tutor SSL Setup..."

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
DOMAIN="tutor.novotio.com"

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  Domain: $DOMAIN"
echo ""

# Check if domain is pointing to the server
echo "🔍 Checking DNS resolution..."
SERVER_IP=$(ssh $VPS_USER@$VPS_HOST "curl -s ifconfig.me")
DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')

echo "  Server IP: $SERVER_IP"
echo "  Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  Warning: Domain $DOMAIN may not be pointing to the server IP"
    echo "   Please ensure DNS is configured correctly before proceeding"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ SSL setup cancelled"
        exit 1
    fi
fi

echo ""

# Check if certbot is available
echo "🔍 Checking certbot availability..."
ssh $VPS_USER@$VPS_HOST "which certbot" || {
    echo "❌ Certbot not found. Please install certbot first."
    echo "   Run: sudo apt-get install certbot python3-certbot-nginx"
    exit 1
}

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate..."
ssh $VPS_USER@$VPS_HOST "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@novotio.com" || {
    echo "❌ Failed to obtain SSL certificate"
    echo "   This might be due to:"
    echo "   - DNS not being configured correctly"
    echo "   - Domain not pointing to the server"
    echo "   - Firewall blocking port 80/443"
    echo "   - Rate limiting from Let's Encrypt"
    exit 1
}

echo "✅ SSL certificate obtained successfully"
echo ""

# Verify certificate
echo "🔍 Verifying certificate..."
ssh $VPS_USER@$VPS_HOST "certbot certificates | grep -A 10 '$DOMAIN'" || {
    echo "⚠️  Certificate verification failed, but continuing..."
}

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
ssh $VPS_USER@$VPS_HOST "nginx -t" || {
    echo "❌ Nginx configuration test failed after SSL setup!"
    exit 1
}

echo "✅ Nginx configuration test passed"
echo ""

# Reload nginx
echo "🔄 Reloading nginx..."
ssh $VPS_USER@$VPS_HOST "systemctl reload nginx"

echo ""
echo "✅ SSL setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: ./deploy-tutor/05-start-services.sh"
echo ""
echo "🌐 Your site will be available at: https://$DOMAIN"
echo ""
echo "🔒 SSL certificate will auto-renew every 60 days"
echo "" 