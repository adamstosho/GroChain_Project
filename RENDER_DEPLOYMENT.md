# Deploy GroChain Backend to Render

## Why Render Instead of Vercel?

Vercel's serverless architecture causes database connection issues:
- ❌ Cold starts on every request
- ❌ No persistent database connections
- ❌ Connection pooling problems
- ❌ Function timeout limitations

Render provides:
- ✅ Persistent database connections
- ✅ No cold start issues
- ✅ Proper connection pooling
- ✅ Long-running processes support

## Deployment Steps

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 2. Deploy Backend Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the `backend` folder
- Use these settings:
  - **Name**: `grochain-backend`
  - **Environment**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: `Free`

### 3. Set Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://omoridoh111:Allahu009@cluster1.evqfycs.mongodb.net/Grochain_App
CORS_ORIGIN=https://gro-chain.vercel.app
FRONTEND_URL=https://gro-chain.vercel.app
```

### 4. Update Frontend Configuration
After deployment, update frontend to point to Render backend:
- Update `vercel.json` files
- Update `client/lib/constants.ts`

### 5. Test Deployment
- Backend will be available at: `https://grochain-backend.onrender.com`
- Test API endpoints
- Verify database connections work

## Benefits of This Approach

1. **Stable Database Connections**: No more connection issues
2. **Better Performance**: No cold starts
3. **Proper Error Handling**: Full stack traces
4. **Cost Effective**: Render's free tier is generous
5. **Easy Scaling**: Can upgrade to paid plans when needed

## Next Steps

1. Deploy backend to Render
2. Update frontend configuration
3. Test complete application
4. Monitor performance and errors
