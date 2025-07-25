# Personal Tutor Deployment

This directory contains deployment scripts for the Personal Tutor application to `tutor.novotio.com`.

## 🚀 Quick Start

To deploy the entire application in one go:

```bash
chmod +x deploy-tutor/00-deploy-all.sh
./deploy-tutor/00-deploy-all.sh
```

## 📋 Prerequisites

Before running the deployment scripts, ensure you have:

1. **DNS Configuration**: Point `tutor.novotio.com` to your VPS IP (`89.116.170.241`)
2. **SSH Access**: Ability to connect to the VPS as root
3. **Local Build**: The application should build successfully locally
4. **Environment Variables**: All necessary environment variables should be configured

## 🔧 Individual Scripts

### 1. Server Setup (`01-setup-server.sh`)
- Tests SSH connection
- Creates application directory
- Installs/verifies Node.js, PM2, nginx, and certbot
- Prepares the server environment

### 2. App Deployment (`02-deploy-app.sh`)
- Builds the application locally
- Creates deployment package
- Uploads files to the server
- Installs production dependencies

### 3. Nginx Configuration (`03-configure-nginx.sh`)
- Creates nginx configuration for `tutor.novotio.com`
- Sets up proxy to port 3001
- Configures static asset serving
- Enables the site and reloads nginx

### 4. SSL Setup (`04-setup-ssl.sh`)
- Obtains Let's Encrypt SSL certificate
- Configures automatic HTTP to HTTPS redirect
- Verifies certificate installation

### 5. Start Services (`05-start-services.sh`)
- Starts the application using PM2
- Configures auto-restart on server reboot
- Verifies the service is running correctly

## 🌐 Deployment Architecture

```
Internet → nginx (port 80/443) → Personal Tutor App (port 3001)
```

- **Domain**: `tutor.novotio.com`
- **Application Port**: 3001
- **SSL**: Let's Encrypt (auto-renewing)
- **Process Manager**: PM2
- **Web Server**: nginx

## 📁 File Structure on Server

```
/var/www/personal-tutor/
├── build/           # Built application
├── static/          # Static assets
├── package.json     # Dependencies
├── ecosystem.config.cjs  # PM2 configuration
└── logs/            # Application logs
```

## 🔄 Updating the Application

To update the application after initial deployment:

```bash
# Deploy new version
./deploy-tutor/02-deploy-app.sh

# Restart services
./deploy-tutor/05-start-services.sh
```

## 🛠️ Troubleshooting

### Common Issues

1. **DNS Not Configured**
   - Ensure `tutor.novotio.com` points to `89.116.170.241`
   - Wait for DNS propagation (can take up to 24 hours)

2. **SSL Certificate Failed**
   - Check DNS configuration
   - Ensure port 80 is accessible
   - Check Let's Encrypt rate limits

3. **Application Not Starting**
   - Check logs: `ssh root@89.116.170.241 'pm2 logs personal-tutor'`
   - Verify environment variables
   - Check port 3001 availability

4. **Nginx Configuration Error**
   - Test configuration: `ssh root@89.116.170.241 'nginx -t'`
   - Check syntax in `/etc/nginx/sites-available/tutor.novotio.conf`

### Useful Commands

```bash
# View application logs
ssh root@89.116.170.241 'pm2 logs personal-tutor'

# Check service status
ssh root@89.116.170.241 'pm2 status'

# Restart application
ssh root@89.116.170.241 'pm2 restart personal-tutor'

# Check nginx status
ssh root@89.116.170.241 'systemctl status nginx'

# View nginx logs
ssh root@89.116.170.241 'tail -f /var/log/nginx/tutor.novotio-error.log'
```

## 🔒 Security Considerations

- SSL certificates auto-renew every 60 days
- Security headers are configured in nginx
- Application runs on non-standard port (3001)
- PM2 provides process isolation and auto-restart

## 📞 Support

If you encounter issues:

1. Check the logs using the commands above
2. Verify all prerequisites are met
3. Ensure DNS is properly configured
4. Check server resources (CPU, memory, disk space)

## 🎯 Configuration

All scripts use the following configuration:

- **VPS Host**: `89.116.170.241`
- **VPS User**: `root`
- **Domain**: `tutor.novotio.com`
- **App Directory**: `/var/www/personal-tutor`
- **App Port**: `3001`
- **Service Name**: `personal-tutor`

To modify these settings, edit the configuration variables at the top of each script. 