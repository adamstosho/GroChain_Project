@echo off
REM GroChain Production Deployment Script for Windows
REM This script automates the deployment process for production

echo 🚀 Starting GroChain Production Deployment
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PM2 not found. Installing PM2...
    npm install -g pm2
    if %errorlevel% neq 0 (
        echo ❌ Failed to install PM2
        exit /b 1
    )
    echo ✅ PM2 installed successfully
)

REM Create necessary directories
echo ✅ Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups
if not exist "backend\uploads\avatars" mkdir backend\uploads\avatars

REM Backup current deployment
if exist "backend" if exist "client" (
    echo ✅ Creating backup of current deployment...
    set BACKUP_NAME=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set BACKUP_NAME=%BACKUP_NAME: =0%
    tar -czf "backups\%BACKUP_NAME%.tar.gz" backend client
    echo ✅ Backup created: backups\%BACKUP_NAME%.tar.gz
)

REM Check environment files
echo ✅ Checking environment configuration...

if not exist "backend\.env" (
    echo ❌ Backend .env file not found!
    echo ⚠️  Please create backend\.env with production configuration
    exit /b 1
)

if not exist "client\.env.local" (
    echo ⚠️  Frontend .env.local file not found!
    echo ⚠️  Please create client\.env.local with production configuration
)

REM Install backend dependencies
echo ✅ Installing backend dependencies...
cd backend
call npm ci --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Install frontend dependencies and build
echo ✅ Installing frontend dependencies...
cd ..\client
call npm ci
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo ✅ Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    exit /b 1
)
echo ✅ Frontend built successfully

REM Go back to root directory
cd ..

REM Stop existing PM2 processes
echo ✅ Stopping existing PM2 processes...
pm2 stop ecosystem.config.js 2>nul
pm2 delete ecosystem.config.js 2>nul

REM Start applications with PM2
echo ✅ Starting applications with PM2...
pm2 start ecosystem.config.js --env production
if %errorlevel% neq 0 (
    echo ❌ Failed to start PM2 processes
    exit /b 1
)

REM Save PM2 configuration
echo ✅ Saving PM2 configuration...
pm2 save

REM Wait for applications to start
echo ✅ Waiting for applications to start...
timeout /t 10 /nobreak >nul

REM Health check
echo ✅ Performing health checks...

REM Check backend health
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend health check failed
    pm2 logs grochain-backend --lines 20
    exit /b 1
)
echo ✅ Backend health check passed

REM Check frontend health
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Frontend health check failed
    pm2 logs grochain-frontend --lines 20
    exit /b 1
)
echo ✅ Frontend health check passed

REM Display PM2 status
echo ✅ PM2 Status:
pm2 status

REM Display application URLs
echo.
echo 🌐 Application URLs:
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:3000
echo Health Check: http://localhost:5000/api/health
echo.

REM Display PM2 monitoring commands
echo 📊 Monitoring Commands:
echo View logs: pm2 logs
echo Monitor: pm2 monit
echo Restart: pm2 restart all
echo Stop: pm2 stop all
echo.

echo ✅ Deployment completed successfully! 🎉
echo.
echo 🎉 GroChain is now running in production mode!
echo ⚠️  Remember to:
echo 1. Configure your reverse proxy (Nginx/Apache)
echo 2. Setup SSL certificates
echo 3. Configure firewall rules
echo 4. Setup monitoring and alerting
echo 5. Configure automated backups
echo.
echo 📖 For more information, see DEPLOYMENT_GUIDE.md

pause
