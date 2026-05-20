# Product User Manual System Documentation

## Overview
The Product User Manual System allows administrators to add optional user manuals for individual products. When a product has a user manual, users must read and accept it before viewing the product details.

## Features

### 1. Admin Features
- **Add Product Manual**: Admin can add an optional user manual when creating or editing a product
- **Edit Product Manual**: Admin can update the manual content at any time
- **Remove Product Manual**: Admin can remove the manual by clearing the field
- **Manual Preview**: Admin can see the manual content in a textarea with monospace font

### 2. User Features
- **Manual Dialog**: When viewing a product with a manual, users see a dialog with the manual content
- **Read and Accept**: Users must check "I have read and understood the product user manual" to proceed
- **One-Time Acceptance**: Once accepted, users won't see the manual again for that product
- **Blocked Access**: Product details are hidden until the manual is accepted

### 3. Technical Features
- **Per-Product Tracking**: Each product can have its own manual
- **Per-User Tracking**: System tracks which users accepted which product's manual
- **Database Storage**: Manuals stored in products table, acceptances in product_user_manual_acceptances table
- **RLS Policies**: Proper security policies for data access

## Database Schema

### Products Table
```sql
ALTER TABLE products ADD COLUMN user_manual TEXT;
```

### Product User Manual Acceptances Table
```sql
CREATE TABLE product_user_manual_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

## API Functions

### 1. checkProductUserManualAcceptance
```typescript
checkProductUserManualAcceptance(userId: string, productId: string): Promise<boolean>
```
Checks if a user has accepted a product's manual.

### 2. acceptProductUserManual
```typescript
acceptProductUserManual(userId: string, productId: string): Promise<ProductUserManualAcceptance>
```
Records that a user has accepted a product's manual.

### 3. getProductUserManualAcceptances
```typescript
getProductUserManualAcceptances(userId: string): Promise<ProductUserManualAcceptance[]>
```
Gets all product manual acceptances for a user.

## Components

### ProductUserManualDialog
A modal dialog that displays the product user manual with:
- Product name in the title
- Scrollable manual content
- Checkbox for acceptance
- Accept button (disabled until checkbox is checked)
- Non-dismissible (user must accept to proceed)

## User Flow

1. User navigates to a product detail page
2. System checks if product has a user manual
3. If manual exists, system checks if user has accepted it
4. If not accepted:
   - Show ProductUserManualDialog
   - Hide product details
   - Show "Product Manual Required" message
5. User reads manual and checks acceptance checkbox
6. User clicks "Accept and Continue"
7. System records acceptance in database
8. Dialog closes and product details are revealed

## Admin Flow

1. Admin navigates to Products → Add/Edit Product
2. Admin fills in product details
3. Admin scrolls to "Product User Manual (Optional)" field
4. Admin enters manual content (usage instructions, warnings, etc.)
5. Admin saves product
6. Manual is now associated with the product

## Use Cases

### Example 1: Electronics Product
```
Product: Wireless Headphones
Manual Content:
- Charge for 2 hours before first use
- Do not expose to water
- Bluetooth pairing instructions
- Battery life: 20 hours
- Warranty: 1 year
```

### Example 2: Food Product
```
Product: Organic Honey
Manual Content:
- Store in cool, dry place
- Do not refrigerate
- Natural crystallization is normal
- Not suitable for infants under 1 year
- Best before: See package
```

### Example 3: Clothing Product
```
Product: Silk Scarf
Manual Content:
- Hand wash only in cold water
- Do not wring or twist
- Lay flat to dry
- Iron on low heat if needed
- Dry clean recommended
```

## Benefits

1. **Product Safety**: Ensure users read important safety information
2. **Usage Instructions**: Provide clear usage guidelines
3. **Warranty Information**: Communicate warranty terms
4. **Legal Protection**: Document that users were informed
5. **Customer Satisfaction**: Reduce returns due to misuse
6. **Flexible**: Optional per product, not required for all products

## Technical Notes

- Manual content is stored as plain text
- Whitespace is preserved (whitespace-pre-wrap)
- No character limit on manual content
- Manual dialog cannot be dismissed without acceptance
- Acceptance is permanent (cannot be undone)
- If product is deleted, all acceptances are also deleted (CASCADE)
- If user is deleted, all their acceptances are deleted (CASCADE)

## Future Enhancements

Possible future improvements:
- Rich text editor for manual content
- Multiple language support
- Version tracking for manual updates
- PDF export of manual
- Email manual to user after acceptance
- Manual templates for common product types
- Analytics on manual acceptance rates
