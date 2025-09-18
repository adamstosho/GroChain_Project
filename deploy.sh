#!/bin/bash

# GroChain Production Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="grochain"
BACKEND_DIR="./backend"
FRONTEND_DIR="./client"
LOG_DIR="./logs"
BACKUP_DIR="./backups"

echo -e "${BLUE}🚀 Starting GroChain Production Deployment${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2..."
    npm install -g pm2
    print_status "PM2 installed successfully"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR
mkdir -p $BACKEND_DIR/uploads/avatars

# Backup current deployment
if [ -d "$BACKEND_DIR" ] && [ -d "$FRONTEND_DIR" ]; then
    print_status "Creating backup of current deployment..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" $BACKEND_DIR $FRONTEND_DIR
    print_status "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
fi

# Check environment files
print_status "Checking environment configuration..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error "Backend .env file not found!"
    print_warning "Please create $BACKEND_DIR/.env with production configuration"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    print_warning "Frontend .env.local file not found!"
    print_warning "Please create $FRONTEND_DIR/.env.local with production configuration"
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd $BACKEND_DIR
npm ci --production
print_status "Backend dependencies installed"

# Install frontend dependencies and build
print_status "Installing frontend dependencies..."
cd ../$FRONTEND_DIR
npm ci
print_status "Frontend dependencies installed"

print_status "Building frontend for production..."
npm run build
print_status "Frontend built successfully"

# Go back to root directory
cd ..

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start applications with PM2
print_status "Starting applications with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup 2>/dev/null || print_warning "PM2 startup setup requires sudo privileges"

# Wait for applications to start
print_status "Waiting for applications to start..."
sleep 10

# Health check
print_status "Performing health checks..."

# Check backend health
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed"
    pm2 logs grochain-backend --lines 20
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend health check passed"
else
    print_error "Frontend health check failed"
    pm2 logs grochain-frontend --lines 20
    exit 1
fi

# Display PM2 status
print_status "PM2 Status:"
pm2 status

# Display application URLs
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "Backend API: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Health Check: http://localhost:5000/api/health"
echo ""

# Display PM2 monitoring commands
echo -e "${BLUE}📊 Monitoring Commands:${NC}"
echo "View logs: pm2 logs"
echo "Monitor: pm2 monit"
echo "Restart: pm2 restart all"
echo "Stop: pm2 stop all"
echo ""

print_status "Deployment completed successfully! 🎉"

# Optional: Setup log rotation
if command -v logrotate &> /dev/null; then
    print_status "Setting up log rotation..."
    cat > /tmp/grochain-logrotate << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    if [ -w /etc/logrotate.d/ ]; then
        sudo mv /tmp/grochain-logrotate /etc/logrotate.d/grochain
        print_status "Log rotation configured"
    else
        print_warning "Could not setup log rotation (requires sudo privileges)"
        print_warning "Manual setup: sudo mv /tmp/grochain-logrotate /etc/logrotate.d/grochain"
    fi
fi

echo ""
echo -e "${GREEN}🎉 GroChain is now running in production mode!${NC}"
echo -e "${YELLOW}Remember to:${NC}"
echo "1. Configure your reverse proxy (Nginx/Apache)"
echo "2. Setup SSL certificates"
echo "3. Configure firewall rules"
echo "4. Setup monitoring and alerting"
echo "5. Configure automated backups"
echo ""
echo -e "${BLUE}For more information, see DEPLOYMENT_GUIDE.md${NC}"
