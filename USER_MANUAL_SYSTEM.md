# User Manual System

## Overview
Implemented a comprehensive user manual system that allows admins to create and manage user manuals that users must read and accept before accessing the products page. The system tracks user acceptances and only shows the manual once per user.

---

## Problem Solved

### Before ❌
- No way for admin to communicate important information to users
- Users might miss important guidelines or instructions
- No mechanism to ensure users read important information
- No tracking of who has read the manual

### After ✅
- Admin can create and edit user manual from Settings page
- Admin can activate/deactivate user manual anytime
- Users see a modal popup with the manual when accessing products page
- Users must check "I have read and understood" before proceeding
- System tracks acceptances - manual only shown once per user
- Cannot dismiss dialog without accepting
- Clear and professional presentation

---

## Features Implemented

### 1. Database Schema

**user_manual Table**:
```sql
CREATE TABLE user_manual (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**user_manual_acceptances Table**:
```sql
CREATE TABLE user_manual_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_manual_id UUID NOT NULL REFERENCES user_manual(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, user_manual_id)
);
```

**Benefits**:
- Tracks manual versions and acceptances
- Prevents duplicate acceptances with UNIQUE constraint
- Cascading deletes maintain data integrity
- Timestamp tracking for audit purposes
- Boolean flag for easy activation/deactivation

### 2. Row Level Security (RLS)

**user_manual Policies**:
```sql
-- Anyone can view active user manuals
CREATE POLICY "Anyone can view active user manuals"
  ON user_manual FOR SELECT
  USING (is_active = true);

-- Admins can manage user manuals
CREATE POLICY "Admins can manage user manuals"
  ON user_manual FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

**user_manual_acceptances Policies**:
```sql
-- Users can view their own acceptances
CREATE POLICY "Users can view their own acceptances"
  ON user_manual_acceptances FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own acceptances
CREATE POLICY "Users can create their own acceptances"
  ON user_manual_acceptances FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
  ON user_manual_acceptances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

**Benefits**:
- Users can only see and create their own acceptances
- Admins have full visibility
- Active manuals are publicly readable
- Secure data access control

### 3. Type System

**UserManual Interface**:
```typescript
export interface UserManual {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**UserManualAcceptance Interface**:
```typescript
export interface UserManualAcceptance {
  id: string;
  user_id: string;
  user_manual_id: string;
  accepted_at: string;
}
```

**Benefits**:
- Type-safe data handling
- IntelliSense support
- Compile-time error checking
- Clear data structure

### 4. API Functions

**User Manual CRUD**:
```typescript
// Get all user manuals (admin)
export const getAllUserManuals = async (): Promise<UserManual[]>

// Get active user manual (public)
export const getActiveUserManual = async (): Promise<UserManual | null>

// Create user manual (admin)
export const createUserManual = async (manual: Omit<UserManual, 'id' | 'created_at' | 'updated_at'>): Promise<UserManual>

// Update user manual (admin)
export const updateUserManual = async (id: string, updates: Partial<Omit<UserManual, 'id' | 'created_at' | 'updated_at'>>): Promise<UserManual>

// Delete user manual (admin)
export const deleteUserManual = async (id: string): Promise<void>
```

**Acceptance Tracking**:
```typescript
// Check if user has accepted a manual
export const checkUserManualAcceptance = async (userId: string, manualId: string): Promise<boolean>

// Record user acceptance
export const acceptUserManual = async (userId: string, manualId: string): Promise<UserManualAcceptance>

// Get user's acceptance history
export const getUserManualAcceptances = async (userId: string): Promise<UserManualAcceptance[]>
```

**Benefits**:
- Clean API abstraction
- Error handling built-in
- Consistent data access patterns
- Easy to use and maintain

### 5. Admin Settings Integration

**User Manual Editor**:
- Title input field
- Content textarea (12 rows, monospace font)
- Active/Inactive toggle switch
- Save button with loading state
- Success/error toast notifications

**UI Implementation**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>User Manual</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Active Toggle */}
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="manual-active">Active</Label>
        <p className="text-xs text-muted-foreground">
          Show user manual popup to users
        </p>
      </div>
      <Switch
        id="manual-active"
        checked={userManual.is_active}
        onCheckedChange={(checked) => setUserManual({ ...userManual, is_active: checked })}
      />
    </div>

    {/* Title Input */}
    <div className="space-y-2">
      <Label htmlFor="manual-title">Title</Label>
      <Input
        id="manual-title"
        value={userManual.title}
        onChange={(e) => setUserManual({ ...userManual, title: e.target.value })}
      />
    </div>

    {/* Content Textarea */}
    <div className="space-y-2">
      <Label htmlFor="manual-content">Content</Label>
      <Textarea
        id="manual-content"
        value={userManual.content}
        onChange={(e) => setUserManual({ ...userManual, content: e.target.value })}
        rows={12}
        className="font-mono text-sm"
        placeholder="Enter user manual content"
      />
      <p className="text-xs text-muted-foreground">
        Users will see this popup when accessing products page (if active and not yet accepted)
      </p>
    </div>

    {/* Save Button */}
    <Button onClick={handleUserManualUpdate} disabled={loading}>
      {loading ? 'Saving...' : 'Save User Manual'}
    </Button>
  </CardContent>
</Card>
```

**Features**:
- Easy to use interface
- Real-time preview of changes
- Clear instructions for admin
- Instant activation/deactivation
- Professional design

### 6. UserManualDialog Component

**Features**:
- Modal dialog that cannot be dismissed
- Scrollable content area
- BookOpen icon in header
- "I have read and understood" checkbox
- Accept button (disabled until checkbox is checked)
- Professional and clean design

**UI Implementation**:
```tsx
export function UserManualDialog({ manual, open, onAccept }: UserManualDialogProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh]" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            {manual.title}
          </DialogTitle>
          <DialogDescription>
            Please read the user manual carefully before proceeding
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm whitespace-pre-wrap">
            {manual.content}
          </div>
        </ScrollArea>

        <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="agree" className="cursor-pointer">
            I have read and understood the user manual
          </Label>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full sm:w-auto"
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Key Features**:
- `onOpenChange={() => {}}`: Prevents closing by clicking outside
- `onInteractOutside={(e) => e.preventDefault()}`: Blocks outside interactions
- `disabled={!agreed}`: Button only enabled after checkbox is checked
- `whitespace-pre-wrap`: Preserves formatting in content
- `ScrollArea`: Handles long content gracefully
- Responsive design (max-w-2xl, max-h-90vh)

### 7. ProductsPage Integration

**Implementation**:
```tsx
// State
const [userManual, setUserManual] = useState<UserManual | null>(null);
const [showManualDialog, setShowManualDialog] = useState(false);

// Check for user manual on page load
useEffect(() => {
  const checkUserManual = async () => {
    if (!user) return;

    try {
      const manual = await getActiveUserManual();
      if (manual) {
        const hasAccepted = await checkUserManualAcceptance(user.id, manual.id);
        if (!hasAccepted) {
          setUserManual(manual);
          setShowManualDialog(true);
        }
      }
    } catch (error) {
      console.error('Failed to check user manual:', error);
    }
  };

  checkUserManual();
}, [user]);

// Handle acceptance
const handleAcceptManual = async () => {
  if (!user || !userManual) return;

  try {
    await acceptUserManual(user.id, userManual.id);
    setShowManualDialog(false);
    toast.success('Thank you for reading the user manual');
  } catch (error) {
    console.error('Failed to accept user manual:', error);
    toast.error('Failed to save acceptance');
  }
};

// Render dialog
{userManual && (
  <UserManualDialog
    manual={userManual}
    open={showManualDialog}
    onAccept={handleAcceptManual}
  />
)}
```

**Flow**:
1. User navigates to Products page
2. System checks if user is logged in
3. System fetches active user manual
4. System checks if user has already accepted this manual
5. If not accepted, show dialog
6. User reads manual and checks acceptance box
7. User clicks "Accept and Continue"
8. System records acceptance in database
9. Dialog closes and user can browse products
10. Manual won't show again for this user

---

## User Flows

### Admin Creates User Manual

1. **Admin navigates to Settings**:
   - Goes to Admin Panel
   - Clicks on Settings

2. **Admin scrolls to User Manual section**:
   - Sees User Manual card
   - Views current manual (if exists)

3. **Admin edits user manual**:
   - Updates title (e.g., "Welcome to Shottopoth")
   - Updates content with important information
   - Toggles "Active" switch to ON
   - Clicks "Save User Manual"

4. **System saves changes**:
   - Updates database
   - Shows success toast
   - Manual is now active

### User Encounters User Manual

1. **User logs in**:
   - Enters credentials
   - Successfully logs in

2. **User navigates to Products page**:
   - Clicks on "Products" in navigation
   - Page starts loading

3. **System checks for manual**:
   - Fetches active user manual
   - Checks if user has accepted it
   - User hasn't accepted yet

4. **Dialog appears**:
   - Modal popup shows with manual content
   - User cannot dismiss it
   - Accept button is disabled

5. **User reads manual**:
   - Scrolls through content
   - Understands the information

6. **User accepts manual**:
   - Checks "I have read and understood" box
   - Accept button becomes enabled
   - Clicks "Accept and Continue"

7. **System records acceptance**:
   - Saves acceptance to database
   - Shows success toast
   - Dialog closes

8. **User browses products**:
   - Can now interact with products page
   - Manual won't show again

### Admin Deactivates User Manual

1. **Admin goes to Settings**:
   - Opens Admin Panel
   - Navigates to Settings

2. **Admin toggles manual off**:
   - Finds User Manual section
   - Toggles "Active" switch to OFF
   - Clicks "Save User Manual"

3. **System updates**:
   - Manual is deactivated
   - New users won't see the dialog
   - Existing acceptances are preserved

---

## Benefits

### For Admins

✅ **Communication Tool**: Direct way to communicate important information to users
✅ **Easy Management**: Simple interface to create and edit manual
✅ **Instant Control**: Can activate/deactivate anytime
✅ **Tracking**: Can see who has accepted the manual
✅ **Flexibility**: Can update content as needed
✅ **Professional**: Clean and professional presentation

### For Users

✅ **Clear Information**: Important information presented clearly
✅ **One-Time**: Only shown once per user
✅ **Cannot Miss**: Modal ensures users see the information
✅ **Easy to Read**: Scrollable content with good formatting
✅ **Simple Acceptance**: Just check box and click button
✅ **No Interruption**: Won't show again after acceptance

### For Business

✅ **Compliance**: Ensure users read important information
✅ **Onboarding**: Great for user onboarding process
✅ **Guidelines**: Communicate usage guidelines
✅ **Updates**: Inform users about policy changes
✅ **Legal**: Can be used for legal disclaimers
✅ **Audit Trail**: Complete record of acceptances

---

## Use Cases

### 1. User Onboarding
**Scenario**: New users need to understand how to use the platform

**Manual Content**:
```
Welcome to Shottopoth!

Here's how to get started:

1. Browse Products
   - View all available products
   - Filter by category
   - Search for specific items

2. Add to Cart
   - Select product options (color, size)
   - Choose quantity
   - Add to cart

3. Checkout
   - Review your cart
   - Enter delivery address
   - Choose payment method
   - Complete order

4. Track Orders
   - View order status
   - Track delivery
   - Write reviews after delivery

Need help? Contact our support team!
```

### 2. Policy Updates
**Scenario**: Business updates return policy

**Manual Content**:
```
Important Update: Return Policy

We've updated our return policy:

- Returns accepted within 7 days
- Product must be unused and in original packaging
- Return shipping paid by customer
- Refund processed within 5-7 business days

Please read our full return policy in the Terms and Conditions.

Thank you for your understanding!
```

### 3. Promotional Guidelines
**Scenario**: Special promotion with specific rules

**Manual Content**:
```
Flash Sale Guidelines

Our flash sale is now live!

Important Rules:
- Limited stock available
- First come, first served
- No returns on sale items
- Vouchers cannot be combined with sale prices
- Sale ends in 48 hours

Happy shopping!
```

### 4. Safety Information
**Scenario**: E-commerce platform selling electronics

**Manual Content**:
```
Product Safety Information

Before purchasing electronic items:

⚠️ Safety Guidelines:
- Check voltage compatibility
- Use original chargers only
- Keep away from water
- Read product manual before use
- Contact support for technical issues

Your safety is our priority!
```

---

## Technical Implementation

### Database Queries

**Check if user has accepted manual**:
```sql
SELECT id 
FROM user_manual_acceptances 
WHERE user_id = $1 AND user_manual_id = $2;
```

**Record acceptance**:
```sql
INSERT INTO user_manual_acceptances (user_id, user_manual_id)
VALUES ($1, $2)
ON CONFLICT (user_id, user_manual_id) DO NOTHING
RETURNING *;
```

**Get active manual**:
```sql
SELECT * 
FROM user_manual 
WHERE is_active = true 
LIMIT 1;
```

**Update manual**:
```sql
UPDATE user_manual 
SET title = $1, content = $2, is_active = $3, updated_at = NOW()
WHERE id = $4
RETURNING *;
```

### State Management

**ProductsPage State**:
```typescript
const [userManual, setUserManual] = useState<UserManual | null>(null);
const [showManualDialog, setShowManualDialog] = useState(false);
```

**AdminSettings State**:
```typescript
const [userManual, setUserManual] = useState<UserManual | null>(null);
const [loading, setLoading] = useState(false);
```

### Error Handling

**API Errors**:
```typescript
try {
  await acceptUserManual(user.id, userManual.id);
  toast.success('Thank you for reading the user manual');
} catch (error) {
  console.error('Failed to accept user manual:', error);
  toast.error('Failed to save acceptance');
}
```

**Missing Data**:
```typescript
if (!user || !userManual) return;
```

**Network Errors**:
```typescript
try {
  const manual = await getActiveUserManual();
  // Process manual
} catch (error) {
  console.error('Failed to check user manual:', error);
  // Fail silently - don't block user
}
```

---

## Testing

### Test 1: Admin Creates Manual
1. Login as admin
2. Navigate to Settings
3. Scroll to User Manual section
4. ✅ See user manual editor
5. Enter title: "Welcome Guide"
6. Enter content: "Welcome to our platform..."
7. Toggle Active to ON
8. Click Save
9. ✅ Success toast appears
10. ✅ Manual saved to database

### Test 2: User Sees Manual (First Time)
1. Login as regular user
2. Navigate to Products page
3. ✅ Dialog appears with manual
4. ✅ Cannot click outside to close
5. ✅ Accept button is disabled
6. Check "I have read and understood"
7. ✅ Accept button becomes enabled
8. Click "Accept and Continue"
9. ✅ Dialog closes
10. ✅ Can browse products

### Test 3: User Doesn't See Manual (Second Time)
1. User already accepted manual
2. Navigate to Products page
3. ✅ No dialog appears
4. ✅ Can browse products immediately
5. ✅ Acceptance recorded in database

### Test 4: Admin Deactivates Manual
1. Login as admin
2. Navigate to Settings
3. Toggle User Manual Active to OFF
4. Click Save
5. ✅ Manual deactivated
6. Login as new user
7. Navigate to Products page
8. ✅ No dialog appears
9. ✅ New users don't see manual

### Test 5: Manual Content Formatting
1. Admin enters multi-line content
2. Includes line breaks and spacing
3. Saves manual
4. User views manual
5. ✅ Formatting preserved
6. ✅ Line breaks displayed correctly
7. ✅ Content is readable

### Test 6: Dialog Cannot Be Dismissed
1. User sees manual dialog
2. Try clicking outside dialog
3. ✅ Dialog stays open
4. Try pressing Escape key
5. ✅ Dialog stays open
6. Try clicking X button (if any)
7. ✅ No X button present
8. ✅ Only way to close is accepting

---

## Security Considerations

### Row Level Security
- Users can only create acceptances for themselves
- Users cannot see other users' acceptances
- Admins have full access to all data
- Active manuals are publicly readable
- Inactive manuals are hidden from users

### Data Validation
- Title and content are required fields
- User ID and manual ID validated before acceptance
- Duplicate acceptances prevented by UNIQUE constraint
- Timestamps automatically managed

### Access Control
- Only admins can create/edit/delete manuals
- Only admins can activate/deactivate manuals
- Users can only accept manuals for themselves
- Guest users don't see manual dialog

---

## Future Enhancements

### Potential Improvements
- [ ] Version tracking for manual updates
- [ ] Require re-acceptance when manual is updated
- [ ] Multiple manuals for different sections
- [ ] Rich text editor for manual content
- [ ] Preview mode for admin
- [ ] Analytics dashboard (acceptance rate, time to accept)
- [ ] Email notification when manual is updated
- [ ] Multi-language support
- [ ] Downloadable PDF version
- [ ] Video manual support
- [ ] Quiz/test after reading manual
- [ ] Expiring acceptances (require re-acceptance after X days)

---

## API Reference

### UserManual Type
```typescript
interface UserManual {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### UserManualAcceptance Type
```typescript
interface UserManualAcceptance {
  id: string;
  user_id: string;
  user_manual_id: string;
  accepted_at: string;
}
```

### API Functions
```typescript
// Get all manuals (admin)
getAllUserManuals(): Promise<UserManual[]>

// Get active manual (public)
getActiveUserManual(): Promise<UserManual | null>

// Create manual (admin)
createUserManual(manual: Omit<UserManual, 'id' | 'created_at' | 'updated_at'>): Promise<UserManual>

// Update manual (admin)
updateUserManual(id: string, updates: Partial<Omit<UserManual, 'id' | 'created_at' | 'updated_at'>>): Promise<UserManual>

// Delete manual (admin)
deleteUserManual(id: string): Promise<void>

// Check acceptance
checkUserManualAcceptance(userId: string, manualId: string): Promise<boolean>

// Record acceptance
acceptUserManual(userId: string, manualId: string): Promise<UserManualAcceptance>

// Get user acceptances
getUserManualAcceptances(userId: string): Promise<UserManualAcceptance[]>
```

---

## Summary

Successfully implemented a comprehensive user manual system that allows admins to create and manage user manuals that users must read and accept before accessing the products page. The system includes:

**Key Achievements**:
- ✅ Created user_manual and user_manual_acceptances tables
- ✅ Implemented complete CRUD API for user manuals
- ✅ Added user manual editor in Admin Settings
- ✅ Created UserManualDialog component with mandatory acceptance
- ✅ Integrated dialog in ProductsPage with acceptance tracking
- ✅ Implemented RLS policies for secure data access
- ✅ Added active/inactive toggle for easy control
- ✅ Prevents dialog dismissal until user accepts
- ✅ Tracks acceptances to show manual only once per user
- ✅ Professional and user-friendly design
- ✅ Complete error handling and validation
- ✅ Responsive design for all screen sizes
