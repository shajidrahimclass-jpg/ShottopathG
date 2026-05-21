-- Add notification triggers for admin

-- Function to notify admins about low stock
CREATE OR REPLACE FUNCTION notify_admins_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Check if stock is low (5 or less) and product is active
  IF NEW.stock <= 5 AND NEW.stock > 0 AND NEW.is_active = true THEN
    -- Notify all admin users
    FOR admin_user IN 
      SELECT id FROM profiles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        admin_user.id,
        'system',
        'Low Stock Alert',
        'Product "' || NEW.name || '" is running low on stock. Only ' || NEW.stock || ' units remaining.'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for low stock notifications
DROP TRIGGER IF EXISTS trigger_notify_admins_low_stock ON products;
CREATE TRIGGER trigger_notify_admins_low_stock
  AFTER UPDATE OF stock ON products
  FOR EACH ROW
  WHEN (NEW.stock <= 5 AND NEW.stock <> OLD.stock)
  EXECUTE FUNCTION notify_admins_low_stock();

-- Function to notify admins about new user messages
CREATE OR REPLACE FUNCTION notify_admins_new_message()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  sender_name TEXT;
BEGIN
  -- Only notify if message is from a user (not admin)
  IF NEW.sender_role = 'user' THEN
    SELECT full_name INTO sender_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Notify all admin users
    FOR admin_user IN 
      SELECT id FROM profiles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        admin_user.id,
        'system',
        'New Customer Message',
        'New message from ' || COALESCE(sender_name, 'Customer') || ': ' || 
        CASE 
          WHEN LENGTH(NEW.message) > 50 THEN SUBSTRING(NEW.message, 1, 50) || '...'
          ELSE NEW.message
        END
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new message notifications
DROP TRIGGER IF EXISTS trigger_notify_admins_new_message ON order_messages;
CREATE TRIGGER trigger_notify_admins_new_message
  AFTER INSERT ON order_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_message();

-- Function to notify admins about new orders
CREATE OR REPLACE FUNCTION notify_admins_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notify all admin users about new order
  FOR admin_user IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, order_id)
    VALUES (
      admin_user.id,
      'order',
      'New Order Received',
      'New order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' for ৳' || NEW.total || ' has been placed.',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new order notifications
DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON orders;
CREATE TRIGGER trigger_notify_admins_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_order();
