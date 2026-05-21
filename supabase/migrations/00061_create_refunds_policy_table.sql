-- Create refunds_policy table
CREATE TABLE IF NOT EXISTS refunds_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Refunds Policy',
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE refunds_policy ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active refunds policy
CREATE POLICY "Anyone can view active refunds policy"
  ON refunds_policy
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage refunds policy
CREATE POLICY "Admins can manage refunds policy"
  ON refunds_policy
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default refunds policy
INSERT INTO refunds_policy (title, content, is_active)
VALUES (
  'Refunds Policy',
  '<h2>Refund and Return Policy</h2>
<p>We want you to be completely satisfied with your purchase. If you are not satisfied, we offer a comprehensive refund and return policy.</p>

<h3>Return Period</h3>
<p>You may return most new, unopened items within 30 days of delivery for a full refund. We will also pay the return shipping costs if the return is a result of our error (you received an incorrect or defective item, etc.).</p>

<h3>Eligibility</h3>
<p>To be eligible for a return, your item must be:</p>
<ul>
  <li>Unused and in the same condition that you received it</li>
  <li>In the original packaging</li>
  <li>Accompanied by the receipt or proof of purchase</li>
</ul>

<h3>Non-Returnable Items</h3>
<p>Certain types of items cannot be returned, including:</p>
<ul>
  <li>Perishable goods (such as food, flowers, or plants)</li>
  <li>Custom products (such as special orders or personalized items)</li>
  <li>Personal care goods (such as beauty products)</li>
  <li>Hazardous materials, flammable liquids, or gases</li>
</ul>

<h3>Refund Process</h3>
<p>Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.</p>
<p>If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within a certain amount of days, depending on your card issuer''s policies.</p>

<h3>Late or Missing Refunds</h3>
<p>If you haven''t received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. If you''ve done all of this and you still have not received your refund yet, please contact us.</p>

<h3>Exchanges</h3>
<p>We only replace items if they are defective or damaged. If you need to exchange it for the same item, contact us through our support channels.</p>

<h3>Contact Us</h3>
<p>If you have any questions about our refunds policy, please contact our customer support team.</p>',
  true
)
ON CONFLICT DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_refunds_policy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refunds_policy_updated_at
  BEFORE UPDATE ON refunds_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_refunds_policy_updated_at();
