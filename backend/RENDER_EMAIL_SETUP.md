# Render Email Setup Guide

## The Problem

**Render's free tier BLOCKS outbound SMTP ports (25, 465, 587)**. This means:
- ❌ SMTP (nodemailer with Gmail) **WILL FAIL** on Render
- ✅ SendGrid HTTP API **WILL WORK** on Render

**Why it works on Vercel**: Vercel doesn't block SMTP ports like Render does.

---

## The Solution: Use SendGrid HTTP API

### Step 1: Get SendGrid API Key

1. Go to [SendGrid](https://signup.sendgrid.com/) and create a free account
2. Verify your email address
3. Go to **Settings > API Keys**
4. Click **"Create API Key"**
5. Name it: `grochain-render-production`
6. Select **"Restricted Access"** → Give it **"Mail Send"** permissions
7. Click **"Create & View"**
8. **COPY THE KEY IMMEDIATELY** (you can't see it again!)

### Step 2: Add API Key to Render

1. Go to your Render Dashboard
2. Select your **grochain-backend** service
3. Click **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `SENDGRID_API_KEY`
   - **Value**: Paste the API key you copied
6. Click **"Save Changes"**

### Step 3: Verify Sender Email

1. Go to SendGrid Dashboard
2. Navigate to **Settings > Sender Authentication**
3. Click **"Verify a Single Sender"**
4. Fill in:
   - **From Email**: `grochain.ng@gmail.com`
   - **From Name**: `GroChain`
   - **Reply To**: `grochain.ng@gmail.com`
   - Complete the form with your details
5. Check your Gmail inbox for verification email
6. Click the link to verify

### Step 4: Redeploy

1. Your Render service should auto-redeploy when you save environment variables
2. Or manually redeploy by going to **Manual Deploy** → **Clear build cache & deploy**

---

## Verify Setup

### Check Logs

After deployment, check your Render logs for:

```
✅ EmailQueue: SendGrid initialized (EMAIL_PROVIDER=sendgrid)
```

If you see errors like:
```
❌ EmailQueue: Failed to init SendGrid
```

Then your `SENDGRID_API_KEY` is missing or incorrect.

### Test Email

Try registering a new user and check:
1. Render logs for email sending attempts
2. The recipient's inbox (and spam folder)

---

## Environment Variables Summary

### Required for Render:
- ✅ `EMAIL_PROVIDER=sendgrid`
- ✅ `SENDGRID_API_KEY` (set in Render dashboard)
- ✅ `SENDGRID_FROM_EMAIL=grochain.ng@gmail.com`
- ✅ `SENDGRID_FROM_NAME=GroChain`

### Not Required (but kept as fallback):
- `SMTP_HOST`, `SMTP_PORT`, etc. (won't work on Render, but kept for Vercel/local)

---

## Troubleshooting

### "SendGrid send failed" error

**Error**: `The from email does not match a verified Sender Identity`

**Solution**: Verify your sender email in SendGrid dashboard (Step 3 above)

---

### "API key is invalid"

**Solution**: 
1. Generate a new API key in SendGrid
2. Update `SENDGRID_API_KEY` in Render dashboard
3. Redeploy

---

### Still no emails?

1. **Check Render logs** for email-related errors
2. **Check SendGrid Activity Feed** (in SendGrid dashboard) to see if emails were accepted
3. **Check spam folder** - sometimes emails from SendGrid end up there initially

---

## Why This Works

- SendGrid HTTP API uses HTTPS (port 443) which Render doesn't block
- SMTP uses ports 25/465/587 which Render **does** block
- This is why Vercel works (doesn't block SMTP) but Render doesn't

---

## Cost

SendGrid Free Tier:
- ✅ 100 emails/day free
- ✅ No credit card required
- ✅ Perfect for testing and small production

Upgrade when you need more than 100/day.
