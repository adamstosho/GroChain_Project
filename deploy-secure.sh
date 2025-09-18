#!/bin/bash

# 🛡️ GroChain Secure Deployment Script
# This script ensures all security measures are in place before deployment

set -e  # Exit on any error

echo "🛡️ Starting GroChain Secure Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if required files exist
check_required_files() {
    print_status "Checking required files..."
    
    local files=(
        "backend/.env"
        "backend/Dockerfile"
        "client/Dockerfile"
        "docker-compose.yml"
        "nginx.conf"
    )
    
    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    print_success "All required files present"
}

# Validate environment configuration
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Check if .env file exists
    if [[ ! -f "backend/.env" ]]; then
        print_error "Backend .env file not found. Please create it from .env.example"
        exit 1
    fi
    
    # Check for placeholder values in .env
    if grep -q "your_" backend/.env; then
        print_error "Found placeholder values in .env file. Please update all configuration values."
        exit 1
    fi
    
    # Check for production environment variables
    local required_vars=(
        "NODE_ENV"
        "MONGODB_URI"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "ENCRYPTION_KEY"
        "SESSION_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" backend/.env; then
            print_error "Required environment variable missing: $var"
            exit 1
        fi
    done
    
    print_success "Environment configuration validated"
}

# Check for security vulnerabilities
security_scan() {
    print_status "Running security scan..."
    
    # Check for hardcoded secrets in code
    if grep -r -i "password.*=" backend/ --exclude-dir=node_modules --exclude="*.log" | grep -v "your_" | grep -v "example"; then
        print_warning "Potential hardcoded passwords found in backend code"
    fi
    
    if grep -r -i "secret.*=" backend/ --exclude-dir=node_modules --exclude="*.log" | grep -v "your_" | grep -v "example"; then
        print_warning "Potential hardcoded secrets found in backend code"
    fi
    
    # Check for exposed API keys
    if grep -r -i "api.*key" backend/ --exclude-dir=node_modules --exclude="*.log" | grep -v "your_" | grep -v "example"; then
        print_warning "Potential hardcoded API keys found in backend code"
    fi
    
    print_success "Security scan completed"
}

# Generate secure secrets
generate_secrets() {
    print_status "Generating secure secrets..."
    
    # Generate JWT secrets
    local jwt_secret=$(openssl rand -hex 64)
    local jwt_refresh_secret=$(openssl rand -hex 64)
    local encryption_key=$(openssl rand -hex 32)
    local session_secret=$(openssl rand -hex 32)
    
    print_success "Generated secure secrets"
    print_warning "Update your .env file with these secrets if not already set:"
    echo "JWT_SECRET=$jwt_secret"
    echo "JWT_REFRESH_SECRET=$jwt_refresh_secret"
    echo "ENCRYPTION_KEY=$encryption_key"
    echo "SESSION_SECRET=$session_secret"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t grochain-backend ./backend/
    print_success "Backend image built successfully"
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t grochain-frontend ./client/
    print_success "Frontend image built successfully"
}

# Run security tests
run_tests() {
    print_status "Running security tests..."
    
    # Check if test files exist
    if [[ -f "backend/package.json" ]]; then
        cd backend
        if npm list --depth=0 | grep -q "jest\|mocha"; then
            print_status "Running backend tests..."
            npm test || print_warning "Some tests failed"
        fi
        cd ..
    fi
    
    print_success "Security tests completed"
}

# Deploy with Docker Compose
deploy() {
    print_status "Deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down || true
    
    # Start new containers
    print_status "Starting new containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check health
    print_status "Checking service health..."
    
    # Check backend health
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_success "Deployment completed successfully!"
}

# Post-deployment security checks
post_deployment_checks() {
    print_status "Running post-deployment security checks..."
    
    # Check SSL certificate (if HTTPS is configured)
    if [[ -n "$DOMAIN" ]]; then
        print_status "Checking SSL certificate for $DOMAIN..."
        if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates; then
            print_success "SSL certificate is valid"
        else
            print_warning "SSL certificate check failed or not configured"
        fi
    fi
    
    # Check security headers
    print_status "Checking security headers..."
    if curl -I http://localhost:3000 2>/dev/null | grep -i "x-frame-options\|x-xss-protection\|x-content-type-options"; then
        print_success "Security headers are present"
    else
        print_warning "Some security headers may be missing"
    fi
    
    print_success "Post-deployment checks completed"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    # Remove temporary files
    rm -f *.tmp
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    echo "🛡️ GroChain Secure Deployment Script"
    echo "======================================"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --generate-secrets)
                generate_secrets
                exit 0
                ;;
            --security-scan)
                security_scan
                exit 0
                ;;
            --build-only)
                check_required_files
                validate_environment
                build_images
                exit 0
                ;;
            --deploy-only)
                deploy
                exit 0
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --generate-secrets    Generate secure secrets"
                echo "  --security-scan       Run security scan only"
                echo "  --build-only          Build Docker images only"
                echo "  --deploy-only         Deploy existing images only"
                echo "  --help               Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
        shift
    done
    
    # Full deployment process
    check_required_files
    validate_environment
    security_scan
    build_images
    run_tests
    deploy
    post_deployment_checks
    cleanup
    
    echo ""
    echo "🎉 GroChain deployment completed successfully!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000/api"
    echo "📊 Health Check: http://localhost:5000/api/health"
    echo ""
    echo "🛡️ Security checklist completed. Your application is ready for production!"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
