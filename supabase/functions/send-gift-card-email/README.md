# Send Gift Card Email Function

This Edge Function sends gift card emails to recipients using the Resend email service.

## Setup Instructions

### 1. Get Resend API Key

1. Create a free account at [resend.com](https://resend.com)
2. Navigate to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 2. Verify Sender Email Domain (Important!)

**Note**: By default, this function sends emails from `noreply@miaoda.com`. For production use, you should:

1. **Option A - Use Resend's Test Domain** (Quick Start):
   - Resend provides `onboarding@resend.dev` for testing
   - Update the Edge Function to use this sender email
   - Limited to 100 emails/day

2. **Option B - Verify Your Own Domain** (Recommended for Production):
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain (e.g., `yourdomain.com`)
   - Add the DNS records provided by Resend
   - Wait for verification (usually a few minutes)
   - Update the sender email in the Edge Function to use your domain

### 3. Configure Supabase Secret

You need to add the Resend API key as a secret in your Supabase project:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)

#### Option B: Using Supabase CLI
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 4. Verify Configuration

After setting up the secret:
1. Go to Admin → Send Gift Card in your application
2. Fill in the gift card details
3. Click "Send Gift Card"
4. If configured correctly, the email will be sent successfully

## Troubleshooting

### Error: "Email service not configured"
- **Cause**: The `RESEND_API_KEY` secret is not set or is invalid
- **Solution**: Follow the setup instructions above to add the secret

### Error: "Template not found"
- **Cause**: The selected email template doesn't exist in the database
- **Solution**: Go to Admin → Gift Card Templates and ensure templates are created and active

### Error: "Failed to send email" or "Domain not verified"
- **Cause**: The sender email domain is not verified in Resend
- **Solution**: 
  - **Quick Fix**: Use Resend's test email `onboarding@resend.dev` by updating line 264 in the Edge Function
  - **Production Fix**: Verify your domain in Resend dashboard (see step 2 above)
  - Check if your Resend API key is valid
  - Verify your Resend account is active
  - Check Resend dashboard for any issues

### Error: "Invalid API key" (403)
- **Cause**: The Resend API key is invalid or doesn't have permission
- **Solution**: 
  - Verify the API key is correct (starts with `re_`)
  - Create a new API key in Resend dashboard
  - Update the secret in Supabase

### Error: Rate limit exceeded
- **Cause**: You've exceeded Resend's free tier limits (100 emails/day)
- **Solution**: 
  - Wait 24 hours for the limit to reset
  - Upgrade your Resend plan for higher limits

## Features

- Sends personalized gift card emails using customizable templates
- Supports multiple template designs (Birthday, Holiday, Thank You, etc.)
- Includes gift code, value, and custom messages
- Automatic date stamping
- Professional HTML email design

## API Endpoint

**POST** `/functions/v1/send-gift-card-email`

### Request Body
```json
{
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "productName": "Gift Card - ৳500",
  "giftCode": "GC-XXXX-XXXX-XXXX",
  "giftValue": "৳500",
  "customMessage": "Optional custom message",
  "templateId": "uuid-of-template"
}
```

### Response
```json
{
  "success": true,
  "emailId": "resend-email-id",
  "message": "Gift card email sent successfully"
}
```

## Email Service Provider

This function uses [Resend](https://resend.com) for email delivery:
- Free tier: 100 emails/day, 3,000 emails/month
- Reliable delivery with high deliverability rates
- Simple API integration
- Email tracking and analytics

## Support

For issues or questions:
1. Check the error message in the admin panel
2. Review the Edge Function logs in Supabase dashboard
3. Verify all configuration steps are completed
