@echo off
echo 🚀 Deploying GroChain Backend Fix to Vercel...
echo ==============================================

REM Check if we're in the backend directory
if not exist "app.js" (
    echo ❌ Error: Please run this script from the backend directory
    exit /b 1
)

REM Check git status
echo 📋 Checking git status...
git status

REM Add all changes
echo 📦 Adding changes to git...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Fix Vercel deployment: CORS, database timeout, and route loading

- Fixed CORS configuration for Vercel deployment
- Added database connection timeout for serverless environment
- Modified app to load routes even if database connection fails
- Enhanced Vercel configuration with proper headers
- Added OPTIONS handler for preflight requests"

REM Push to main branch
echo 🚀 Pushing to main branch...
git push origin main

echo.
echo ✅ Deployment initiated!
echo.
echo 🔍 Next steps:
echo 1. Check your Vercel dashboard for deployment status
echo 2. Wait for deployment to complete (usually 1-2 minutes)
echo 3. Test the endpoints:
echo    - https://gro-back.vercel.app
echo    - https://gro-back.vercel.app/api/health
echo    - https://gro-back.vercel.app/api/auth/login (OPTIONS request)
echo.
echo 📊 Monitor deployment logs in Vercel dashboard for any issues
echo.
echo 🎉 Your backend should now work properly with your frontend!
pause
