# Email Configuration Deployment Guide

## Issues Found and Fixed

### 1. Critical Syntax Error Fixed ✅
- **Problem**: Unreachable code after `return true` in auth.controller.js
- **Fix**: Removed unreachable SMTP code that was causing the function to never reach the SMTP fallback

### 2. Environment Variables Configuration ✅
- **Problem**: SMTP variables in render.yaml were set to `sync: false`
- **Fix**: Updated render.yaml to set proper SMTP_USER and SMTP_FROM values

## Required Environment Variables for Production

### In Render Dashboard, set these environment variables:

1. **SMTP_PASS** (Required) - Your Gmail App Password
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password (not your regular Gmail password)

2. **SENDGRID_API_KEY** (Optional backup) - If you want to use SendGrid as backup
   - Get from SendGrid dashboard

3. **SENDGRID_FROM_EMAIL** (Optional) - Your verified sender email in SendGrid

## Current Configuration

Your render.yaml is now configured with:
- EMAIL_PROVIDER: smtp
- SMTP_HOST: smtp.gmail.com
- SMTP_PORT: 587
- SMTP_SECURE: false
- SMTP_USER: grochain.ng@gmail.com
- SMTP_FROM: grochain.ng@gmail.com

## Testing Email Functionality

### Test Endpoint Available
Use the debug endpoint to test email sending:
```
POST /api/debug/test-email
{
  "to": "artreoxai@gmail.com",
  "subject": "Test Email",
  "message": "This is a test email from GroChain"
}
```

## Deployment Steps

1. **Update your Render service** with the new render.yaml
2. **Set SMTP_PASS** in Render dashboard environment variables
3. **Redeploy** your backend service
4. **Test** with the test endpoint or try user registration

## Troubleshooting

### If emails still don't work:

1. **Check Render logs** for email-related errors
2. **Verify Gmail App Password** is correct
3. **Check Gmail security settings** - ensure "Less secure app access" is not blocking
4. **Try SendGrid as backup** by setting SENDGRID_API_KEY

### Common Issues:
- Gmail App Password not set correctly
- Gmail 2FA not enabled (required for App Passwords)
- SMTP_PASS environment variable not set in Render
- Gmail blocking the connection (check Gmail security settings)

## Email Flow Priority

1. **SMTP (Gmail)** - Primary method
2. **SendGrid** - Fallback if SMTP fails
3. **Console logging** - Development fallback

The system will try SMTP first, then SendGrid, then log to console if both fail.
