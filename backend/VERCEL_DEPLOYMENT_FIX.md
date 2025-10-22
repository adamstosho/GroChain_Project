# Vercel Deployment Fix Guide

## Issues Fixed

### 1. CORS Configuration
- ✅ Added proper CORS headers in `vercel.json`
- ✅ Updated CORS options in `app.js` to allow Vercel domains
- ✅ Added explicit OPTIONS handler for preflight requests

### 2. Vercel Configuration
- ✅ Enhanced `vercel.json` with proper headers
- ✅ Added CORS headers for API routes

## Environment Variables Required

Make sure these environment variables are set in your Vercel dashboard:

### Required Variables:
```
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
CORS_ORIGIN=https://gro-chain.vercel.app
```

### Optional Variables:
```
JWT_SECRET=your_jwt_secret
PAYSTACK_SECRET_KEY=your_paystack_secret
SENDGRID_API_KEY=your_sendgrid_key
```

## Deployment Steps

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Fix CORS and Vercel deployment issues"
   git push origin main
   ```

2. **Redeploy on Vercel:**
   - Go to your Vercel dashboard
   - Trigger a new deployment
   - Or it will auto-deploy from your git push

3. **Test the deployment:**
   - Visit: `https://gro-back.vercel.app`
   - Check health: `https://gro-back.vercel.app/api/health`
   - Test CORS: `https://gro-back.vercel.app/api/auth/login` (OPTIONS request)

## Testing CORS Fix

You can test the CORS fix using curl:

```bash
# Test OPTIONS preflight request
curl -X OPTIONS \
  -H "Origin: https://gro-chain.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  https://gro-back.vercel.app/api/auth/login

# Test actual POST request
curl -X POST \
  -H "Origin: https://gro-chain.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  https://gro-back.vercel.app/api/auth/login
```

## Database Connection

If the database is still showing as "disconnected":

1. **Check MongoDB URI format:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

2. **Verify network access:**
   - Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0)
   - Or add Vercel's IP ranges to your MongoDB whitelist

3. **Check connection string:**
   - Make sure there are no special characters that need URL encoding
   - Verify the database name is correct

## Troubleshooting

### If CORS still fails:
1. Check browser developer tools for the exact error
2. Verify the origin header matches exactly
3. Test with a simple curl request first

### If database connection fails:
1. Check Vercel function logs
2. Verify environment variables are set correctly
3. Test MongoDB connection string locally first

## Next Steps

After deployment:
1. Test the login functionality from your frontend
2. Check the database connection status
3. Monitor Vercel function logs for any errors
4. Update your frontend API base URL if needed
