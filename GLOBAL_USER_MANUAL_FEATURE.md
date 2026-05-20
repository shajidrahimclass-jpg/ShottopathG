# Global User Manual Popup Feature

## Overview
The user manual popup now appears globally across all pages when users are logged in, not just on product pages. This ensures users see important information regardless of where they navigate in the application.

## How It Works

### For Users:
1. **First Login**: When a user logs in and there's an active user manual, they will see a popup dialog
2. **Must Accept**: Users must read and check the "I have read and understood" checkbox before they can continue
3. **One-Time Display**: Once accepted, the manual won't show again for that specific manual version
4. **All Pages**: The popup can appear on any page (home, products, cart, profile, etc.)

### For Admins:
1. **Manage in Settings**: Go to Admin → Settings → User Manual section
2. **Toggle Active**: Use the switch to enable/disable the popup
3. **Edit Content**: 
   - **Title**: Customize the popup title
   - **Content**: Write the manual content (supports multi-line text)
4. **Save Changes**: Click "Save User Manual" to apply changes

## Admin Configuration

### Location:
**Admin Panel → Settings → User Manual**

### Fields:
- **Active Toggle**: Enable/disable the popup globally
- **Title**: The heading shown in the popup (e.g., "User Manual", "Important Notice", "Terms of Use")
- **Content**: The main text content users must read

### Example Use Cases:
1. **Welcome Message**: Introduce new users to your platform
2. **Terms Update**: Notify users of policy changes
3. **Important Announcements**: Share critical information
4. **Usage Guidelines**: Explain how to use specific features
5. **Safety Instructions**: Provide important safety or legal information

## Technical Details

### Database Tables:
- `user_manual`: Stores the manual content and active status
- `user_manual_acceptances`: Tracks which users have accepted which manuals

### Implementation:
- **Location**: `src/components/layouts/MainLayout.tsx`
- **Component**: `UserManualDialog`
- **Trigger**: Automatically checks on user login and page navigation
- **Persistence**: Uses Supabase to track acceptances

### User Experience:
- **Non-dismissible**: Users cannot close the dialog without accepting
- **Responsive**: Works on mobile and desktop
- **Accessible**: Includes proper ARIA labels and keyboard navigation

## Benefits

1. **Compliance**: Ensure users acknowledge important terms or policies
2. **Onboarding**: Guide new users through platform features
3. **Communication**: Share critical updates with all users
4. **Flexibility**: Update content anytime without code changes
5. **Tracking**: Know which users have seen and accepted the manual

## Best Practices

### Content Writing:
- Keep it concise and scannable
- Use clear, simple language
- Break content into sections with headings
- Highlight key points
- Include contact information if needed

### When to Use:
- ✅ Important policy changes
- ✅ New feature announcements
- ✅ Safety or legal requirements
- ✅ Platform usage guidelines
- ❌ Marketing messages (use announcements instead)
- ❌ Frequent updates (users may get annoyed)

### Timing:
- Enable when you have important information to share
- Disable after most users have seen it
- Create a new manual for major updates (users will see it again)

## Example Content

```
Welcome to Shottopoth!

Before you start shopping, please note:

1. Product Availability
   - Stock levels are updated in real-time
   - Popular items may sell out quickly

2. Payment Methods
   - We accept bKash, Nagad, and Cash on Delivery
   - Online payments are processed securely

3. Delivery Information
   - Standard delivery: 3-5 business days
   - Express delivery available in major cities

4. Returns & Refunds
   - 7-day return policy on most items
   - See our Refunds Policy for details

For questions, contact our support team.

Happy shopping!
```

## Troubleshooting

### Manual Not Showing:
1. Check if "Active" toggle is enabled in Admin Settings
2. Verify user is logged in
3. Check if user has already accepted this manual
4. Clear browser cache and try again

### Manual Shows Every Time:
1. Check database connection
2. Verify `user_manual_acceptances` table has proper policies
3. Check browser console for errors

### Cannot Save Changes:
1. Verify admin permissions
2. Check Supabase connection
3. Ensure all required fields are filled

## Future Enhancements

Potential improvements for future versions:
- Multiple manuals for different user roles
- Scheduled manual activation
- Rich text editor for content
- Preview before publishing
- Analytics on acceptance rates
- Email notification when new manual is published
- Version history and rollback
- Multi-language support

---

**Last Updated**: 2026-05-13
**Feature Version**: 1.0
