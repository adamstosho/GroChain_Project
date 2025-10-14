
### 1. Create SendGrid Account

1. Visit [SendGrid Sign Up](https://signup.sendgrid.com/)
2. Fill in your details:
   - Company name
   - Email address
   - Password
   - Phone number (for verification)
3. Verify your email address
4. Complete phone verification

### 2. Account Verification Process

After signup, SendGrid requires account verification:
- Email verification (check your inbox)
- Phone verification (SMS code)
- Identity verification (may be required for some regions)

## Domain Authentication & Sender Verification

### Single Sender Verification (Development/Testing)

1. Navigate to **Settings > Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in sender details:
   ```json
   {
     "from_name": "Your App Name",
     "from_email": "noreply@yourdomain.com",
     "reply_to": "support@yourdomain.com",
     "company_address": "Your Company Address",
     "city": "Your City",
     "state": "Your State",
     "country": "Your Country"
   }
   ```
4. Check your email and click the verification link

### Domain Authentication (Production Recommended)

1. Go to **Settings > Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Choose DNS provider or select "Other"
5. Add the provided DNS records to your domain:
   ```dns
   # Example DNS records provided by SendGrid
   CNAME: s1._domainkey.yourdomain.com -> s1.domainkey.u1234567.wl123.sendgrid.net
   CNAME: s2._domainkey.yourdomain.com -> s2.domainkey.u1234567.wl123.sendgrid.net
   CNAME: em1234.yourdomain.com -> u1234567.wl123.sendgrid.net
   ```
6. Wait for DNS propagation (up to 48 hours)
7. Click **"Verify"** in SendGrid dashboard

## API Key Configuration

### 1. Generate API Key

1. Navigate to **Settings > API Keys**
2. Click **"Create API Key"**
3. Choose **"Full Access"** for complete functionality
4. Name your key (e.g., "Render Backend Production")
5. Click **"Create & View"**
6. **IMPORTANT**: Copy the API key immediately (you won't see it again)

### 2. API Key Permissions (Recommended for Production)

For production, use restricted permissions:

```json
{
  "mail_send": "full",
  "stats": "read",
  "suppression": "read",
  "templates": "read",
  "tracking_settings": "read"
}
```

## Backend Integration

### 1. Install SendGrid Package

```bash
npm install @sendgrid/mail
```

### 2. Environment Variables Setup

Create `.env` file:
```env
# SendGrid Configuration
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name

# Optional: Template IDs
SENDGRID_WELCOME_TEMPLATE_ID=d-xxxxxxxxx
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=d-xxxxxxxxx
SENDGRID_NOTIFICATION_TEMPLATE_ID=d-xxxxxxxxx
```

### 3. SendGrid Service Implementation

Create `services/email.service.js`:

```javascript
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.fromName = process.env.SENDGRID_FROM_NAME;
  }

  /**
   * Send a simple email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} text - Plain text content
   * @param {string} html - HTML content
   * @param {Object} attachments - Email attachments
   */
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        text,
        html,
        attachments
      };

      const response = await sgMail.send(msg);
      console.log('✅ Email sent successfully:', response[0].statusCode);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send email using SendGrid template
   * @param {string} to - Recipient email
   * @param {string} templateId - SendGrid template ID
   * @param {Object} dynamicTemplateData - Template variables
   */
  async sendTemplateEmail({ to, templateId, dynamicTemplateData }) {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        templateId,
        dynamicTemplateData
      };

      const response = await sgMail.send(msg);
      console.log('✅ Template email sent successfully:', response[0].statusCode);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Template email sending failed:', error);
      throw new Error(`Template email sending failed: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   * @param {Array} recipients - Array of recipient objects
   * @param {string} subject - Email subject
   * @param {string} text - Plain text content
   * @param {string} html - HTML content
   */
  async sendBulkEmails({ recipients, subject, text, html }) {
    try {
      const messages = recipients.map(recipient => ({
        to: recipient.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        text: text.replace(/\{\{name\}\}/g, recipient.name),
        html: html.replace(/\{\{name\}\}/g, recipient.name)
      }));

      const response = await sgMail.send(messages);
      console.log('✅ Bulk emails sent successfully');
      return { success: true, count: recipients.length };
    } catch (error) {
      console.error('❌ Bulk email sending failed:', error);
      throw new Error(`Bulk email sending failed: ${error.message}`);
    }
  }

  /**
   * Send welcome email
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   */
  async sendWelcomeEmail({ to, name }) {
    const templateId = process.env.SENDGRID_WELCOME_TEMPLATE_ID;
    
    if (templateId) {
      return this.sendTemplateEmail({
        to,
        templateId,
        dynamicTemplateData: { name }
      });
    }

    // Fallback to simple email
    return this.sendEmail({
      to,
      subject: `Welcome to ${this.fromName}!`,
      text: `Hello ${name}, welcome to our platform!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${this.fromName}!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining us. We're excited to have you on board!</p>
          <p>Best regards,<br>The ${this.fromName} Team</p>
        </div>
      `
    });
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   * @param {string} resetLink - Password reset link
   */
  async sendPasswordResetEmail({ to, name, resetLink }) {
    const templateId = process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID;
    
    if (templateId) {
      return this.sendTemplateEmail({
        to,
        templateId,
        dynamicTemplateData: { name, resetLink }
      });
    }

    // Fallback to simple email
    return this.sendEmail({
      to,
      subject: 'Password Reset Request',
      text: `Hello ${name}, click the link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link: ${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>The ${this.fromName} Team</p>
        </div>
      `
    });
  }

  /**
   * Send notification email
   * @param {string} to - Recipient email
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} actionUrl - Optional action URL
   */
  async sendNotificationEmail({ to, title, message, actionUrl }) {
    const templateId = process.env.SENDGRID_NOTIFICATION_TEMPLATE_ID;
    
    if (templateId) {
      return this.sendTemplateEmail({
        to,
        templateId,
        dynamicTemplateData: { title, message, actionUrl }
      });
    }

    // Fallback to simple email
    return this.sendEmail({
      to,
      subject: title,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${message}</p>
          ${actionUrl ? `<a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
          <p>Best regards,<br>The ${this.fromName} Team</p>
        </div>
      `
    });
  }
}

module.exports = new EmailService();
```

### 4. Controller Integration

Update your notification controller (`controllers/notification.controller.js`):

```javascript
const emailService = require('../services/email.service');
const User = require('../models/user.model');

const notificationController = {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      await emailService.sendWelcomeEmail({
        to: user.email,
        name: user.name || user.firstName
      });

      res.json({
        status: 'success',
        message: 'Welcome email sent successfully'
      });
    } catch (error) {
      console.error('Welcome email error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send welcome email'
      });
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Generate reset token (implement your token generation logic)
      const resetToken = generateResetToken();
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // Save reset token to user record
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
      await user.save();

      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name || user.firstName,
        resetLink
      });

      res.json({
        status: 'success',
        message: 'Password reset email sent successfully'
      });
    } catch (error) {
      console.error('Password reset email error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email'
      });
    }
  },

  /**
   * Send notification email
   */
  async sendNotificationEmail(req, res) {
    try {
      const { userId, title, message, actionUrl } = req.body;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      await emailService.sendNotificationEmail({
        to: user.email,
        title,
        message,
        actionUrl
      });

      res.json({
        status: 'success',
        message: 'Notification email sent successfully'
      });
    } catch (error) {
      console.error('Notification email error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send notification email'
      });
    }
  },

  /**
   * Send bulk notification emails
   */
  async sendBulkNotificationEmails(req, res) {
    try {
      const { userIds, title, message, actionUrl } = req.body;
      
      const users = await User.find({ _id: { $in: userIds } });
      
      if (users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No users found'
        });
      }

      const recipients = users.map(user => ({
        email: user.email,
        name: user.name || user.firstName
      }));

      await emailService.sendBulkEmails({
        recipients,
        subject: title,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${title}</h2>
            <p>{{name}},</p>
            <p>${message}</p>
            ${actionUrl ? `<a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
            <p>Best regards,<br>The Team</p>
          </div>
        `
      });

      res.json({
        status: 'success',
        message: `Bulk notification sent to ${recipients.length} users`
      });
    } catch (error) {
      console.error('Bulk notification error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send bulk notifications'
      });
    }
  }
};

module.exports = notificationController;
```

## Advanced Features

### 1. Email Templates

Create dynamic templates in SendGrid:

1. Go to **Email API > Dynamic Templates**
2. Click **"Create a Dynamic Template"**
3. Design your template with variables:
   ```html
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
     <h1>Hello {{name}}!</h1>
     <p>Welcome to {{app_name}}.</p>
     <a href="{{action_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{action_text}}</a>
   </div>
   ```
4. Save and note the template ID

### 2. Webhook Configuration

Set up webhooks for event tracking:

1. Go to **Settings > Mail Settings > Event Webhook**
2. Configure webhook URL: `https://your-render-app.onrender.com/api/webhooks/sendgrid`
3. Select events to track:
   - Delivered
   - Opened
   - Clicked
   - Bounced
   - Spam Reports
   - Unsubscribes

Create webhook handler (`routes/webhook.routes.js`):

```javascript
const express = require('express');
const router = express.Router();

// SendGrid webhook handler
router.post('/sendgrid', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const events = JSON.parse(req.body);
    
    events.forEach(event => {
      console.log('📧 SendGrid Event:', {
        email: event.email,
        event: event.event,
        timestamp: event.timestamp,
        sgMessageId: event.sg_message_id
      });

      // Handle different events
      switch (event.event) {
        case 'delivered':
          handleEmailDelivered(event);
          break;
        case 'opened':
          handleEmailOpened(event);
          break;
        case 'clicked':
          handleEmailClicked(event);
          break;
        case 'bounced':
          handleEmailBounced(event);
          break;
        case 'spam_report':
          handleSpamReport(event);
          break;
        case 'unsubscribe':
          handleUnsubscribe(event);
          break;
      }
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).send('Bad Request');
  }
});

// Event handlers
function handleEmailDelivered(event) {
  // Update user's email status
  console.log(`✅ Email delivered to ${event.email}`);
}

function handleEmailOpened(event) {
  // Track email engagement
  console.log(`👀 Email opened by ${event.email}`);
}

function handleEmailClicked(event) {
  // Track link clicks
  console.log(`🔗 Link clicked by ${event.email}: ${event.url}`);
}

function handleEmailBounced(event) {
  // Handle bounced emails
  console.log(`❌ Email bounced for ${event.email}: ${event.reason}`);
}

function handleSpamReport(event) {
  // Handle spam reports
  console.log(`🚫 Spam reported by ${event.email}`);
}

function handleUnsubscribe(event) {
  // Handle unsubscribes
  console.log(`📤 Unsubscribed: ${event.email}`);
}

module.exports = router;
```

### 3. Suppression Management

Handle bounces and unsubscribes:

```javascript
const sgClient = require('@sendgrid/client');

class SuppressionService {
  constructor() {
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
  }

  /**
   * Add email to suppression list
   */
  async addToSuppressionList(email, type = 'bounces') {
    try {
      const request = {
        method: 'POST',
        url: `/v3/suppression/${type}`,
        body: [{ email }]
      };

      const response = await sgClient.request(request);
      console.log('✅ Added to suppression list:', email);
      return response;
    } catch (error) {
      console.error('❌ Suppression list error:', error);
      throw error;
    }
  }

  /**
   * Remove email from suppression list
   */
  async removeFromSuppressionList(email, type = 'bounces') {
    try {
      const request = {
        method: 'DELETE',
        url: `/v3/suppression/${type}`,
        body: [{ email }]
      };

      const response = await sgClient.request(request);
      console.log('✅ Removed from suppression list:', email);
      return response;
    } catch (error) {
      console.error('❌ Suppression removal error:', error);
      throw error;
    }
  }

  /**
   * Get suppression list
   */
  async getSuppressionList(type = 'bounces') {
    try {
      const request = {
        method: 'GET',
        url: `/v3/suppression/${type}`
      };

      const response = await sgClient.request(request);
      return response.body;
    } catch (error) {
      console.error('❌ Get suppression list error:', error);
      throw error;
    }
  }
}

module.exports = new SuppressionService();
```

## Render Deployment

### 1. Environment Variables on Render

1. Go to your Render dashboard
2. Select your service
3. Navigate to **Environment**
4. Add the following variables:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name

# Template IDs (optional)
SENDGRID_WELCOME_TEMPLATE_ID=d-xxxxxxxxx
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=d-xxxxxxxxx
SENDGRID_NOTIFICATION_TEMPLATE_ID=d-xxxxxxxxx

# Webhook Configuration
SENDGRID_WEBHOOK_SECRET=your_webhook_secret_here

# Other required variables
NODE_ENV=production
PORT=10000
```

### 2. Render Configuration

Create `render.yaml`:

```yaml
services:
  - type: web
    name: grochain-backend
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: SENDGRID_API_KEY
        sync: false
      - key: SENDGRID_FROM_EMAIL
        value: noreply@yourdomain.com
      - key: SENDGRID_FROM_NAME
        value: GroChain
```

### 3. Package.json Scripts

Ensure your `package.json` has proper scripts:

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "deploy": "npm run build && npm start"
  }
}
```

## Testing & Monitoring

### 1. Email Testing

Create a test endpoint (`routes/test.routes.js`):

```javascript
const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');

// Test email sending
router.post('/email', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    await emailService.sendEmail({
      to: to || 'test@example.com',
      subject: subject || 'Test Email',
      text: message || 'This is a test email from SendGrid',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email</h2>
          <p>${message || 'This is a test email from SendGrid'}</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    });

    res.json({
      status: 'success',
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
```

### 2. Monitoring Setup

Add monitoring to your email service:

```javascript
// Add to email.service.js
class EmailService {
  constructor() {
    // ... existing code ...
    this.stats = {
      sent: 0,
      failed: 0,
      lastSent: null,
      lastError: null
    };
  }

  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        text,
        html,
        attachments,
        // Add tracking
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      const response = await sgMail.send(msg);
      
      // Update stats
      this.stats.sent++;
      this.stats.lastSent = new Date();
      
      console.log('✅ Email sent successfully:', response[0].statusCode);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      // Update stats
      this.stats.failed++;
      this.stats.lastError = error.message;
      
      console.error('❌ Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.sent / (this.stats.sent + this.stats.failed) * 100
    };
  }
}
```

### 3. Health Check Endpoint

Create health check endpoint:

```javascript
// Add to your main app.js or routes
app.get('/health', (req, res) => {
  const emailStats = emailService.getStats();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      sendgrid: {
        status: 'connected',
        stats: emailStats
      }
    }
  });
});
```

## Troubleshooting

### Common Issues & Solutions

#### 1. "Forbidden" Error
**Problem**: API key doesn't have sufficient permissions
**Solution**: 
- Check API key permissions in SendGrid dashboard
- Regenerate API key with "Full Access"
- Verify API key is correctly set in environment variables

#### 2. "Unauthorized" Error
**Problem**: Invalid API key or sender not verified
**Solution**:
- Verify API key is correct
- Check sender email is verified in SendGrid
- Ensure domain authentication is complete

#### 3. Emails Going to Spam
**Problem**: Poor sender reputation
**Solution**:
- Complete domain authentication
- Use consistent "from" address
- Avoid spam trigger words
- Implement proper unsubscribe handling

#### 4. High Bounce Rate
**Problem**: Invalid email addresses
**Solution**:
- Implement email validation
- Use suppression lists
- Clean your email database regularly

#### 5. Webhook Not Receiving Events
**Problem**: Webhook configuration issues
**Solution**:
- Verify webhook URL is accessible
- Check SSL certificate
- Verify webhook secret
- Test webhook endpoint manually

### Debug Commands

Add debugging to your email service:

```javascript
// Add to email.service.js
class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      sgMail.setSubstitutionWrappers('{{', '}}');
    }
    
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.fromName = process.env.SENDGRID_FROM_NAME;
  }

  // Add debug method
  debug() {
    console.log('🔍 SendGrid Debug Info:', {
      apiKey: process.env.SENDGRID_API_KEY ? 'Set' : 'Not Set',
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      nodeEnv: process.env.NODE_ENV
    });
  }
}
```

## Best Practices

### 1. Email Content Best Practices

- **Subject Lines**: Keep under 50 characters, avoid spam words
- **Content**: Use proper HTML structure, include plain text version
- **Images**: Use absolute URLs, include alt text
- **Links**: Use descriptive anchor text
- **Unsubscribe**: Always include unsubscribe link

### 2. Sending Best Practices

- **Rate Limiting**: Don't send too many emails at once
- **Personalization**: Use recipient's name and relevant content
- **Testing**: Always test emails before sending to production
- **Monitoring**: Track delivery rates and engagement metrics

### 3. Security Best Practices

- **API Keys**: Store in environment variables, never in code
- **Validation**: Validate email addresses before sending
- **Suppression**: Maintain suppression lists for bounces/unsubscribes
- **Webhooks**: Verify webhook signatures

### 4. Performance Best Practices

- **Batching**: Send emails in batches for better performance
- **Async Processing**: Use queues for high-volume sending
- **Caching**: Cache template data when possible
- **Monitoring**: Set up alerts for failed sends

### 5. Compliance Best Practices

- **GDPR**: Implement proper consent management
- **CAN-SPAM**: Include physical address and unsubscribe option
- **Data Retention**: Implement proper data retention policies
- **Privacy**: Respect user privacy preferences

## Conclusion

This comprehensive guide provides everything you need to integrate SendGrid effectively into your Node.js backend application and deploy it on Render. By following these steps, you'll have:

- ✅ Reliable email delivery
- ✅ Real-time analytics and monitoring
- ✅ Template management
- ✅ Webhook integration
- ✅ Proper error handling
- ✅ Production-ready deployment

Remember to:
1. Test thoroughly in development
2. Monitor email performance in production
3. Keep your suppression lists clean
4. Regularly review and update your email templates
5. Stay compliant with email regulations

For additional support, refer to:
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Render Documentation](https://render.com/docs)
- [SendGrid Status Page](https://status.sendgrid.com/)

Happy emailing! 📧
