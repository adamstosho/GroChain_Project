# Email Verification Fix - Testing Guide

## Overview
This document explains the email verification fixes implemented to work on Render and other hosting platforms that may block SMTP ports.

## Changes Made

### 1. New Direct SendGrid Utility (`backend/utils/sendgrid-direct.js`)
- **Purpose**: Bypasses SMTP port blocking by using SendGrid's HTTP API (port 443)
- **Features**:
  - Automatic retries (up to 3 attempts)
  - Proper error handling
  - Detailed logging
  - Works on Render's free tier

### 2. Updated Email Sending Logic (`backend/controllers/auth.controller.js`)
- **Priority order**:
  1. SendGrid HTTP API (new, works on Render)
  2. @sendgrid/mail package (fallback)
  3. SMTP (local development only)

### 3. Diagnostic Endpoint (`backend/routes/debug.route.js`)
- **Endpoint**: `GET /api/debug/diag-email`
- **Purpose**: Test email configuration and connectivity
- **Returns**: Environment variables, TCP test results, SendGrid API test results

## Testing Steps

### Step 1: Check Environment Variables on Render
1. Go to Render Dashboard → Your Service → Environment
2. Verify these variables are set:
   - `SENDGRID_API_KEY` - Your SendGrid API key
   - `SENDGRID_FROM_EMAIL` - Verified sender email (e.g., `grochain.ng@gmail.com`)
   - `SENDGRID_FROM_NAME` - Sender name (e.g., `GroChain`)
   - `EMAIL_PROVIDER` - Should be `sendgrid`
   - `FRONTEND_URL` - Your frontend URL

### Step 2: Run Diagnostic Endpoint
After deploying to Render, call:
```bash
curl https://your-render-url.com/api/debug/diag-email
```

**Expected Result** (Success):
```json
{
  "ok": true,
  "env": {
    "SENDGRID_API_KEY_present": true,
    "EMAIL_FROM_present": true,
    ...
  },
  "sendgridTest": {
    "status": 202
  },
  "errors": []
}
```

**Expected Result** (Failure):
```json
{
  "ok": false,
  "errors": [
    "SENDGRID_API_KEY missing"
  ]
}
```

### Step 3: Test Email Registration
1. Go to your registration page: `https://your-frontend.com/register`
2. Fill in the registration form
3. Click "Sign Up"
4. Check your email inbox (and spam folder) for verification email

### Step 4: Check Render Logs
Look for these log messages:
- `📧 Using SendGrid HTTP API (direct)...` - Using new utility
- `✅ SendGrid: Email sent successfully` - Success!
- `❌ SendGrid HTTP API failed` - Check error details

## Troubleshooting

### Issue: "SENDGRID_API_KEY missing"
**Solution**:
1. Go to SendGrid Dashboard → Settings → API Keys
2. Create a new API key with "Mail Send" permissions
3. Copy the key
4. Add to Render: Service → Environment → Add key `SENDGRID_API_KEY`

### Issue: "sender not verified"
**Solution**:
1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Verify the email address `grochain.ng@gmail.com`
3. Wait for verification email and click the link

### Issue: Email sent but not received
**Check**:
1. Spam/junk folder
2. SendGrid suppression list: Settings → Suppressions
3. SendGrid activity feed: Activity → All Activity

### Issue: Still not working after fix
**Run diagnostics**:
```bash
curl https://your-render-url.com/api/debug/diag-email | jq
```

Share the output for further troubleshooting.

## Local Testing

To test locally:

1. Set environment variables in `.env`:
```env
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=grochain.ng@gmail.com
SENDGRID_FROM_NAME=GroChain
EMAIL_PROVIDER=sendgrid
FRONTEND_URL=http://localhost:3000
```

2. Run the diagnostic:
```bash
curl http://localhost:5000/api/debug/diag-email
```

3. Test registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@example.com",
    "password": "password123",
    "role": "farmer"
  }'
```

## Deployment Checklist

Before deploying to Render:
- [ ] SendGrid account created
- [ ] SendGrid API key generated
- [ ] Sender email verified in SendGrid
- [ ] API key added to Render environment variables
- [ ] SENDGRID_FROM_EMAIL set in Render
- [ ] Deploy and run diagnostic endpoint
- [ ] Test registration flow
- [ ] Check email delivery

## Support

If issues persist:
1. Run the diagnostic endpoint
2. Check Render logs for errors
3. Check SendGrid activity feed
4. Verify all environment variables are set correctly
