#!/bin/bash

# Personal Tutor Deployment - Nginx Configuration
# This script configures nginx for novotio.com (Personal Tutor AI)

set -e

echo "🚀 Starting Personal Tutor Nginx Configuration..."

# Configuration
VPS_HOST="89.116.170.241"
VPS_USER="root"
DOMAIN="novotio.com"
APP_DIR="/var/www/personal-tutor"
SERVICE_NAME="personal-tutor"
APP_PORT="3001"

echo "📋 Configuration:"
echo "  VPS: $VPS_USER@$VPS_HOST"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo "  App Port: $APP_PORT"
echo ""

# Create complete nginx configuration with both HTTP and HTTPS
echo "📝 Creating complete nginx configuration..."
NGINX_CONFIG=$(cat << EOF
# HTTPS Server Block
server {
    server_name $DOMAIN www.$DOMAIN;
    
    access_log /var/log/nginx/novotio-access.log;
    error_log /var/log/nginx/novotio-error.log;

    # SvelteKit static assets with cache busting
    location ~ ^/_app/immutable/ {
        root $APP_DIR/client/build/client;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files \$uri =404;
    }

    # Other static assets
    location ~ ^/(favicon|assets/|images/|icons/) {
        root $APP_DIR/client/build/client;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
        try_files \$uri \$uri/ =404;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port 443;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # SSL Configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP Server Block (redirect to HTTPS)
server {
    if (\$host = www.$DOMAIN) {
        return 301 https://\$host\$request_uri;
    }

    if (\$host = $DOMAIN) {
        return 301 https://\$host\$request_uri;
    }

    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 404;
}
EOF
)

# Upload nginx configuration to server
echo "📤 Uploading nginx configuration..."
echo "$NGINX_CONFIG" | ssh $VPS_USER@$VPS_HOST "cat > /etc/nginx/sites-available/novotio-landing.conf"

# Enable the site
echo "🔗 Enabling nginx site..."
ssh $VPS_USER@$VPS_HOST "ln -sf /etc/nginx/sites-available/novotio-landing.conf /etc/nginx/sites-enabled/"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
ssh $VPS_USER@$VPS_HOST "nginx -t" || {
    echo "❌ Nginx configuration test failed!"
    exit 1
}

echo "✅ Nginx configuration test passed"
echo ""

# Reload nginx
echo "🔄 Reloading nginx..."
ssh $VPS_USER@$VPS_HOST "systemctl reload nginx"

echo ""
echo "✅ Nginx configuration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: ./deploy-tutor/05-start-services.sh"
echo ""
echo "🌐 Your site will be available at:"
echo "   HTTP:  http://$DOMAIN (redirects to HTTPS)"
echo "   HTTPS: https://$DOMAIN"
echo "" 