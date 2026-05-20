# Product User Manual Access Feature

## Overview
Product user manuals are now accessible from multiple pages throughout the shopping journey, not just on the product detail page. Users can view product manuals from cart, checkout, and orders pages.

## Feature Locations

### 1. Cart Page
- **Location**: Next to each cart item
- **Button**: "Manual" button with file icon
- **Visibility**: Only shown for products that have a user manual
- **Action**: Opens the product user manual dialog

### 2. Orders Page
- **Location**: Under each order item
- **Button**: "View Manual" button with file icon
- **Visibility**: Always shown (fetches manual on click)
- **Action**: Fetches product data and displays manual if available
- **Feedback**: Shows info toast if no manual is available

## User Experience

### Cart Page Flow:
1. User adds products to cart
2. On cart page, products with manuals show a "Manual" button
3. Clicking the button opens the manual dialog
4. User can read the manual without leaving the cart
5. User must check "I have read and understood" to close
6. User can cancel to close without accepting

### Orders Page Flow:
1. User views their order history
2. Each order item has a "View Manual" button
3. Clicking fetches the product details from database
4. If manual exists, opens the manual dialog
5. If no manual, shows "No user manual available" message
6. User can read manual for previously purchased products

## Benefits

### For Customers:
- **Convenient Access**: View product instructions at any time
- **Pre-Purchase Review**: Read manual before completing purchase
- **Post-Purchase Reference**: Access manual after receiving product
- **No Need to Navigate**: Stay on current page while reading manual

### For Business:
- **Reduced Support Tickets**: Customers can self-serve information
- **Better Informed Purchases**: Customers know what they're buying
- **Improved Satisfaction**: Easy access to product information
- **Compliance**: Ensure customers see important product information

## Technical Implementation

### Cart Page:
```typescript
// State management
const [selectedManualProduct, setSelectedManualProduct] = useState<CartItem['product'] | null>(null);
const [showManualDialog, setShowManualDialog] = useState(false);

// Button in cart item (only if manual exists)
{item.product.user_manual && (
  <Button
    size="sm"
    variant="ghost"
    className="text-primary"
    onClick={() => {
      setSelectedManualProduct(item.product);
      setShowManualDialog(true);
    }}
  >
    <FileText className="h-3 w-3 mr-1" />
    Manual
  </Button>
)}

// Dialog component
{selectedManualProduct && (
  <ProductUserManualDialog
    product={selectedManualProduct}
    open={showManualDialog}
    onAccept={() => setShowManualDialog(false)}
    onCancel={() => setShowManualDialog(false)}
  />
)}
```

### Orders Page:
```typescript
// Fetch product and show manual
const handleViewManual = async (productId: string) => {
  try {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (product && product.user_manual) {
      setSelectedManualProduct(product);
      setShowManualDialog(true);
    } else {
      toast.info('No user manual available for this product');
    }
  } catch (error) {
    toast.error('Failed to load product manual');
  }
};

// Button in order item (always shown)
<Button
  size="sm"
  variant="ghost"
  className="text-primary"
  onClick={() => handleViewManual(item.product_id)}
>
  <FileText className="h-3 w-3 mr-1" />
  View Manual
</Button>
```

## Admin Management

### Adding Product Manuals:
1. Go to **Admin → Products**
2. Edit a product
3. Scroll to "Product User Manual (Optional)" field
4. Enter the manual content (supports multi-line text)
5. Save the product

### Manual Content Guidelines:
- **Clear Instructions**: Step-by-step usage instructions
- **Safety Information**: Important warnings and precautions
- **Specifications**: Technical details and requirements
- **Troubleshooting**: Common issues and solutions
- **Contact Info**: Support contact for additional help

## Example Product Manual

```
Cockroach Anti Roach Gel - User Manual

PRODUCT DESCRIPTION:
Professional-grade cockroach control gel bait for indoor use.

USAGE INSTRUCTIONS:
1. Clean the application area thoroughly
2. Apply small dots (pea-sized) of gel in corners and crevices
3. Place gel near cockroach hiding spots (behind appliances, under sinks)
4. Apply 3-5 dots per 10 square meters
5. Do not apply on surfaces that will be cleaned frequently

SAFETY PRECAUTIONS:
⚠️ Keep out of reach of children and pets
⚠️ Do not apply on food contact surfaces
⚠️ Wash hands thoroughly after application
⚠️ Avoid contact with eyes and skin
⚠️ Use in well-ventilated areas

EFFECTIVENESS:
- Starts working within 24-48 hours
- Visible reduction in cockroach activity within 1 week
- Full control achieved in 2-3 weeks
- Remains effective for up to 3 months

STORAGE:
- Store in cool, dry place
- Keep container tightly closed
- Shelf life: 2 years from manufacture date

DISPOSAL:
- Dispose of empty container in household trash
- Do not reuse container

TROUBLESHOOTING:
Q: Gel is drying out quickly
A: Apply in shaded areas away from heat sources

Q: Not seeing results
A: Increase number of application points and ensure proper placement

CONTACT SUPPORT:
For questions or concerns, contact our customer support team.
```

## Best Practices

### For Product Manuals:
1. **Be Comprehensive**: Cover all aspects of product use
2. **Use Clear Language**: Avoid technical jargon
3. **Include Warnings**: Highlight safety information
4. **Format Well**: Use line breaks and sections
5. **Keep Updated**: Review and update regularly

### For Users:
1. **Read Before Use**: Always read manual before using product
2. **Follow Instructions**: Adhere to usage guidelines
3. **Note Warnings**: Pay attention to safety precautions
4. **Contact Support**: Reach out if manual is unclear

## Future Enhancements

Potential improvements:
- PDF download option for manuals
- Print-friendly manual format
- Video manual support
- Multi-language manuals
- Manual version history
- Manual update notifications
- Search within manual
- Bookmark favorite sections
- Share manual via email
- Manual feedback/rating system

## Troubleshooting

### Manual Button Not Showing (Cart):
- Check if product has `user_manual` field populated
- Verify product data is loaded correctly
- Check browser console for errors

### "No manual available" Message (Orders):
- Product may not have a manual configured
- Manual may have been removed after purchase
- Check product in admin panel

### Manual Dialog Not Opening:
- Check browser console for errors
- Verify Supabase connection
- Ensure product data is valid

### Manual Content Not Displaying:
- Check if `user_manual` field contains data
- Verify dialog component is rendering
- Check for CSS issues hiding content

---

**Last Updated**: 2026-05-13
**Feature Version**: 1.0
