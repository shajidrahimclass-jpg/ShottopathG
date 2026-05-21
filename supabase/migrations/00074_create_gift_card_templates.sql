-- Create gift card email templates table
CREATE TABLE IF NOT EXISTS gift_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  occasion TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  header_text TEXT NOT NULL,
  greeting_message TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#10b981',
  secondary_color TEXT NOT NULL DEFAULT '#059669',
  emoji TEXT NOT NULL DEFAULT '🎁',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO gift_card_templates (name, occasion, subject_line, header_text, greeting_message, primary_color, secondary_color, emoji) VALUES
('General Gift Card', 'general', '🎁 Your Gift Card from {siteName}', 'You''ve Received a Gift Card!', 'Great news! You''ve received a gift card from {siteName}. Use the code below to redeem your gift.', '#10b981', '#059669', '🎁'),
('Birthday Gift Card', 'birthday', '🎂 Happy Birthday! Your Gift Card from {siteName}', 'Happy Birthday! 🎉', 'Happy Birthday, {recipientName}! We hope your special day is filled with joy and happiness. Here''s a gift card to celebrate your birthday!', '#ec4899', '#db2777', '🎂'),
('Holiday Gift Card', 'holiday', '🎄 Season''s Greetings! Your Gift Card from {siteName}', 'Happy Holidays! ✨', 'Season''s Greetings, {recipientName}! Wishing you joy and happiness this holiday season. Enjoy your gift card!', '#dc2626', '#b91c1c', '🎄'),
('Thank You Gift Card', 'thankyou', '💝 Thank You! Your Gift Card from {siteName}', 'Thank You! 💝', 'Dear {recipientName}, thank you for your continued support and loyalty. We truly appreciate you! Here''s a special gift card as a token of our gratitude.', '#8b5cf6', '#7c3aed', '💝'),
('Congratulations Gift Card', 'congratulations', '🎊 Congratulations! Your Gift Card from {siteName}', 'Congratulations! 🎊', 'Congratulations, {recipientName}! We''re thrilled to celebrate this special achievement with you. Enjoy your gift card!', '#f59e0b', '#d97706', '🎊');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gift_card_templates_occasion ON gift_card_templates(occasion);
CREATE INDEX IF NOT EXISTS idx_gift_card_templates_active ON gift_card_templates(is_active);