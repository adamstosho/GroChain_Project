# Resend Setup Guide - FREE Email Service for Render

## Why Resend?

✅ **Completely FREE** - Up to 100 emails/day (perfect for development)  
✅ **Works on Render** - Uses HTTP API, bypasses port blocking  
✅ **No credit card required** - Sign up with email only  
✅ **Professional delivery** - Built for developers  
✅ **Easy setup** - Get API key in 2 minutes  

## Setup Steps (5 minutes)

### 1. Create Resend Account
1. Go to https://resend.com
2. Click "Get Started" or "Sign Up"
3. Enter your email address
4. Verify your email (check inbox)
5. **No credit card required!** ✅

### 2. Get API Key
1. Once logged in, go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "GroChain Production" (or any name you like)
4. Click "Create"
5. **Copy the API key** (you'll only see it once!)

### 3. Add Domain (Optional but Recommended)

For production, you should use your own domain:

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `grochain.ng`)
4. Add the provided DNS records to your domain
5. Wait for verification (usually instant)

**For testing**, you can use: `onboarding@resend.dev`

### 4. Configure on Render

1. Go to your Render Dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add these variables:

```
Key: RESEND_API_KEY
Value: [paste your API key here]
```

```
Key: RESEND_FROM_EMAIL
Value: onboarding@resend.dev
```

Or if you added your domain:

```
Key: RESEND_FROM_EMAIL
Value: noreply@grochain.ng
```

6. Click "Save Changes"
7. Your service will automatically redeploy

### 5. Test It!

After deployment completes:

```bash
curl https://your-render-url.com/api/debug/diag-email
```

Look for:
```json
{
  "resendTest": {
    "status": 200
  },
  "ok": true
}
```

## Cost Comparison

| Provider | Free Tier | Works on Render | Setup Time |
|----------|-----------|-----------------|------------|
| **Resend** | 100 emails/day | ✅ Yes | 2 minutes |
| SendGrid | Limited credits | ✅ Yes | 5 minutes |
| SMTP | Unlimited | ❌ No | N/A |

## Migration from SendGrid

If you're currently using SendGrid and hitting credit limits:

1. Sign up for Resend (free)
2. Add `RESEND_API_KEY` to Render
3. Keep `SENDGRID_API_KEY` for fallback
4. Done! System will use Resend first, SendGrid as backup

## Troubleshooting

### "Resend API returned 401"
- Check that `RESEND_API_KEY` is correct
- Make sure there are no extra spaces when copying
- Regenerate API key if needed

### "Resend API returned 422"
- The email address might not be verified
- Use `onboarding@resend.dev` for testing
- Or verify your domain in Resend dashboard

### Email not received
- Check spam folder
- Verify email address is correct
- Check Resend dashboard for delivery logs

## Support

- Resend Docs: https://resend.com/docs
- Status Page: https://status.resend.com
- Our Diagnostic: `/api/debug/diag-email`

## Next Steps

1. ✅ Sign up for Resend
2. ✅ Get API key
3. ✅ Add to Render
4. ✅ Test with diagnostic endpoint
5. ✅ Deploy!

That's it! You're now using a professional, free email service that works perfectly on Render! 🎉
