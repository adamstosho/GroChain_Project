# 🚀 Vercel Deployment Checklist for GroChain Backend

## ✅ Pre-Deployment Verification

### 1. **Core Files Check**
- ✅ `app.js` - Main application file (exports Express app)
- ✅ `package.json` - Contains all dependencies and scripts
- ✅ `vercel.json` - Vercel configuration (corrected to use app.js)

### 2. **Environment Variables Required**
You MUST set these in Vercel dashboard:

#### **Database**
- `MONGODB_URI` - Your MongoDB connection string

#### **Authentication**
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time

#### **CORS & Security**
- `CORS_ORIGIN` - Allowed origins (comma-separated)
- `NODE_ENV` - Set to "production"

#### **Payment Gateways**
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `PAYSTACK_PUBLIC_KEY` - Paystack public key
- `FLUTTERWAVE_SECRET_KEY` - Flutterwave secret key
- `FLUTTERWAVE_PUBLIC_KEY` - Flutterwave public key

#### **Email Services**
- `SENDGRID_API_KEY` - SendGrid API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

#### **Cloud Storage**
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

#### **Google Auth**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### 3. **Dependencies Check**
All required packages are in package.json:
- express, mongoose, cors, helmet, morgan
- compression, cookie-parser, dotenv
- bcryptjs, jsonwebtoken, passport
- multer, cloudinary, qrcode
- axios, moment, uuid

### 4. **Build Test**
- ✅ Syntax check passed (`node -c app.js`)
- ✅ App exports Express instance
- ✅ All routes properly configured

## 🚀 Deployment Steps

### 1. **Push to Git**
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. **Deploy on Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `backend/`
4. Add all environment variables above
5. Deploy!

### 3. **Post-Deployment**
- Test health endpoint: `https://your-app.vercel.app/api/health`
- Verify database connection
- Check authentication endpoints
- Test file uploads
- Verify payment integration

## ⚠️ **Common Issues & Solutions**

### **Issue: Module not found**
- Ensure all dependencies in package.json
- Check import paths are correct

### **Issue: Database connection**
- Verify MONGODB_URI is correct
- Check MongoDB Atlas whitelist

### **Issue: CORS errors**
- Set CORS_ORIGIN properly
- Include frontend domain

### **Issue: Timeout errors**
- Vercel has 30s limit
- Optimize database queries
- Use connection pooling

## 📊 **Monitoring**
- Check Vercel function logs
- Monitor database connections
- Watch for memory usage
- Track response times

## 🔧 **Troubleshooting**
- Check Vercel logs for errors
- Verify environment variables
- Test endpoints individually
- Monitor database performance

---
**Status: READY FOR DEPLOYMENT** ✅
