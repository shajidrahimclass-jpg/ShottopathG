-- Fix notify_admins_new_order: notifications table has no order_id column
-- Use the link column instead to reference the order
CREATE OR REPLACE FUNCTION notify_admins_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      admin_user.id,
      'order',
      'New Order Received',
      'New order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' for ৳' || NEW.total || ' has been placed.',
      '/admin/orders/' || NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON orders;
CREATE TRIGGER trigger_notify_admins_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_order();