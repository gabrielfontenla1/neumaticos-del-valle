-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  voucher_code VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'phone', 'whatsapp', 'in_store', 'admin')),
  notes TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order History Table for audit trail
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_voucher_code ON orders(voucher_code);

-- Create indices for order history
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);

-- Create a sequence for order numbers (optional, for auto-increment format)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1 INCREMENT 1;

-- Enable RLS (Row Level Security) for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anyone to insert their own orders
CREATE POLICY "Allow public to insert orders" ON orders
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Allow authenticated users to view their orders
CREATE POLICY "Allow users to view their orders" ON orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    OR customer_email = current_user_email()
  );

-- RLS Policy: Allow admins to view all orders
CREATE POLICY "Allow admins to view all orders" ON orders
  FOR SELECT
  USING (
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- RLS Policy: Allow admins to update orders
CREATE POLICY "Allow admins to update orders" ON orders
  FOR UPDATE
  USING (
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- RLS Policy: Allow authenticated users to view order history
CREATE POLICY "Allow users to view order history" ON order_history
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_history.order_id
      AND orders.customer_email = current_user_email()
    )
  );

-- RLS Policy: Allow admins to insert order history
CREATE POLICY "Allow admins to insert order history" ON order_history
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- Create helper function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
  order_num VARCHAR(20);
  seq_val INTEGER;
BEGIN
  seq_val := nextval('order_number_seq');
  order_num := 'ORD-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(seq_val::TEXT, 5, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Create function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO order_history (
      order_id,
      action,
      description,
      previous_status,
      new_status,
      user_id
    ) VALUES (
      NEW.id,
      'STATUS_CHANGED',
      'Order status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_change_trigger
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_order_status_change();

-- Create function to log payment status changes
CREATE OR REPLACE FUNCTION log_order_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status != OLD.payment_status THEN
    INSERT INTO order_history (
      order_id,
      action,
      description,
      user_id
    ) VALUES (
      NEW.id,
      'PAYMENT_STATUS_CHANGED',
      'Payment status changed from ' || OLD.payment_status || ' to ' || NEW.payment_status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_payment_change_trigger
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION log_order_payment_change();
