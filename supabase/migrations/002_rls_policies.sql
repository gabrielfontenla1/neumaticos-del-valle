-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Stores policies (public read)
CREATE POLICY "Stores are viewable by everyone" ON public.stores
  FOR SELECT USING (active = true);

CREATE POLICY "Only admins can manage stores" ON public.stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (active = true);

CREATE POLICY "Only admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Brands policies (public read)
CREATE POLICY "Brands are viewable by everyone" ON public.brands
  FOR SELECT USING (active = true);

CREATE POLICY "Only admins can manage brands" ON public.brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Products policies (public read)
CREATE POLICY "Active products are viewable by everyone" ON public.products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Only admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Product images policies (public read)
CREATE POLICY "Product images are viewable by everyone" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage product images" ON public.product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Vouchers policies
CREATE POLICY "Users can view own vouchers" ON public.vouchers
  FOR SELECT USING (
    customer_email = (
      SELECT email FROM public.profiles
      WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Anyone can create vouchers" ON public.vouchers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update vouchers" ON public.vouchers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (
    customer_email = (
      SELECT email FROM public.profiles
      WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Reviews policies
CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Review images policies
CREATE POLICY "Review images are viewable by everyone" ON public.review_images
  FOR SELECT USING (true);

CREATE POLICY "Users can add images to own reviews" ON public.review_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_id
      AND reviews.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Cart sessions policies
CREATE POLICY "Users can view own cart sessions" ON public.cart_sessions
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IS NULL -- Allow anonymous carts
  );

CREATE POLICY "Anyone can create cart sessions" ON public.cart_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own cart sessions" ON public.cart_sessions
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );

CREATE POLICY "Users can delete own cart sessions" ON public.cart_sessions
  FOR DELETE USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- Cart items policies
CREATE POLICY "Users can view own cart items" ON public.cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cart_sessions
      WHERE cart_sessions.id = cart_session_id
      AND (cart_sessions.user_id = auth.uid() OR cart_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can manage own cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cart_sessions
      WHERE cart_sessions.id = cart_session_id
      AND (cart_sessions.user_id = auth.uid() OR cart_sessions.user_id IS NULL)
    )
  );