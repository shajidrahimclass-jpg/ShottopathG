# Email Configuration Guide for Shottopath

## Overview
This guide explains how to customize the email verification emails to use "Shottopath" branding and a custom sender email address.

## Required Configuration

### 1. Custom SMTP Settings (Recommended for Production)

To use `shottopathverify@gmail.com` as the sender email, you need to configure custom SMTP settings in Supabase:

1. **Go to Supabase Dashboard**
   - Navigate to: Project Settings > Auth > SMTP Settings

2. **Enable Custom SMTP**
   - Toggle "Enable Custom SMTP"

3. **Configure Gmail SMTP** (for shottopathverify@gmail.com)
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: shottopathverify@gmail.com
   Password: [App Password - see below]
   Sender Email: shottopathverify@gmail.com
   Sender Name: Shottopath
   ```

4. **Generate Gmail App Password**
   - Go to Google Account Settings
   - Security > 2-Step Verification (must be enabled)
   - App Passwords > Generate new app password
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated 16-character password
   - Use this password in SMTP settings

### 2. Email Template Customization

Customize the email verification template to use Shottopath branding:

1. **Go to Supabase Dashboard**
   - Navigate to: Authentication > Email Templates

2. **Edit "Confirm Signup" Template**
   
   Replace the default template with:

   ```html
   <h2>Welcome to Shottopath!</h2>
   
   <p>Hi there,</p>
   
   <p>Thank you for signing up for Shottopath! We're excited to have you join our community.</p>
   
   <p>Please confirm your email address by clicking the button below:</p>
   
   <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email Address</a></p>
   
   <p>Or copy and paste this link into your browser:</p>
   <p>{{ .ConfirmationURL }}</p>
   
   <p>This link will expire in 24 hours.</p>
   
   <p>If you didn't create an account with Shottopath, you can safely ignore this email.</p>
   
   <p>Best regards,<br>
   The Shottopath Team</p>
   
   <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
   
   <p style="font-size: 12px; color: #6b7280;">
   © 2026 Shottopath. All rights reserved.
   </p>
   ```

3. **Update Email Subject**
   ```
   Verify your email - Shottopath
   ```

### 3. Alternative: Using Supabase Default Email (Quick Setup)

If you want to use Supabase's default email service but with custom branding:

1. **Go to Email Templates** (as above)
2. **Update only the template content** to include Shottopath branding
3. **Note**: Sender will show as "noreply@mail.app.supabase.io" but content will be branded

### 4. Email Template Variables

Available variables you can use in templates:
- `{{ .ConfirmationURL }}` - Email verification link
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your application URL
- `{{ .Email }}` - User's email address

### 5. Testing Email Configuration

After configuration:

1. **Test Signup Flow**
   - Create a new test account
   - Check email inbox for verification email
   - Verify sender shows as "Shottopath <shottopathverify@gmail.com>"
   - Verify email content uses Shottopath branding

2. **Check Spam Folder**
   - Ensure emails are not going to spam
   - If they are, you may need to configure SPF/DKIM records

### 6. DNS Configuration (For Production)

To improve email deliverability:

1. **Add SPF Record**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.google.com ~all
   ```

2. **Add DKIM Record**
   - Follow Gmail's DKIM setup guide
   - Add the provided DKIM TXT record to your DNS

3. **Add DMARC Record**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:shottopathverify@gmail.com
   ```

## Current Status

✅ Application code is ready for custom email branding
⚠️ SMTP configuration needs to be done in Supabase Dashboard
⚠️ Email templates need to be customized in Supabase Dashboard

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Verify SMTP credentials are correct
3. Ensure Gmail App Password is generated (not regular password)
4. Check that 2-Step Verification is enabled on Gmail account

## Security Notes

- Never commit SMTP passwords to version control
- Use App Passwords for Gmail (not your main password)
- Regularly rotate SMTP credentials
- Monitor email sending logs for suspicious activity
