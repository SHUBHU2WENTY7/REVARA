-- =============================================================================
-- REVARA MASTER DASHBOARD REPAIR & AUTH SEPARATION MIGRATION
-- Copy for tff_dashboard_app - Run this in Supabase Studio SQL Runner
-- 1. Dedicated dashboard_admins table (Completely separate from customer app auth)
-- 2. Storage RLS policies for tff-products and tff-exchange-photos
-- 3. Products, Categories, Notifications, Pincodes, Wallets RLS Policies
-- 4. Idempotent approve_exchange_credits RPC (Double-deposit prevention)
-- =============================================================================

-- ── 1. DEDICATED DASHBOARD ADMINS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dashboard_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin','operations_admin','product_admin','customer_support','finance','analyst')),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

ALTER TABLE public.dashboard_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read dashboard_admins" ON public.dashboard_admins;
CREATE POLICY "Allow read dashboard_admins" ON public.dashboard_admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert dashboard_admins" ON public.dashboard_admins;
CREATE POLICY "Allow insert dashboard_admins" ON public.dashboard_admins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update dashboard_admins" ON public.dashboard_admins;
CREATE POLICY "Allow update dashboard_admins" ON public.dashboard_admins FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete dashboard_admins" ON public.dashboard_admins;
CREATE POLICY "Allow delete dashboard_admins" ON public.dashboard_admins FOR DELETE USING (true);

-- Seed default initial super admin
INSERT INTO public.dashboard_admins (email, password_hash, display_name, role)
VALUES (
  'admin@revara.shopping',
  'admin123',
  'Master Admin',
  'super_admin'
)
ON CONFLICT (email) DO UPDATE SET status = 'active';

-- Also seed admin@revara.in for convenience
INSERT INTO public.dashboard_admins (email, password_hash, display_name, role)
VALUES (
  'admin@revara.in',
  'admin123',
  'Operations Admin',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- ── 2. STORAGE BUCKETS & RLS POLICIES ────────────────────────────────────────
-- Ensure buckets exist and are marked public
INSERT INTO storage.buckets (id, name, public)
VALUES ('tff-products', 'tff-products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tff-exchange-photos', 'tff-exchange-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage objects RLS policies
DROP POLICY IF EXISTS "Public Access Products" ON storage.objects;
CREATE POLICY "Public Access Products" ON storage.objects FOR SELECT USING (bucket_id = 'tff-products');

DROP POLICY IF EXISTS "Allow All Uploads Products" ON storage.objects;
CREATE POLICY "Allow All Uploads Products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tff-products');

DROP POLICY IF EXISTS "Allow All Updates Products" ON storage.objects;
CREATE POLICY "Allow All Updates Products" ON storage.objects FOR UPDATE USING (bucket_id = 'tff-products');

DROP POLICY IF EXISTS "Allow All Deletes Products" ON storage.objects;
CREATE POLICY "Allow All Deletes Products" ON storage.objects FOR DELETE USING (bucket_id = 'tff-products');

DROP POLICY IF EXISTS "Public Access Exchange Photos" ON storage.objects;
CREATE POLICY "Public Access Exchange Photos" ON storage.objects FOR SELECT USING (bucket_id = 'tff-exchange-photos');

DROP POLICY IF EXISTS "Allow All Uploads Exchange Photos" ON storage.objects;
CREATE POLICY "Allow All Uploads Exchange Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tff-exchange-photos');

DROP POLICY IF EXISTS "Allow All Updates Exchange Photos" ON storage.objects;
CREATE POLICY "Allow All Updates Exchange Photos" ON storage.objects FOR UPDATE USING (bucket_id = 'tff-exchange-photos') WITH CHECK (bucket_id = 'tff-exchange-photos');

-- ── 3. PRODUCTS & CATEGORIES FULL MANAGEMENT ─────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full management products" ON public.products;
CREATE POLICY "Admins full management products" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full management categories" ON public.categories;
CREATE POLICY "Admins full management categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- ── 4. NOTIFICATIONS BROADCAST RLS POLICY ────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management notifications" ON public.notifications;
CREATE POLICY "Admins full management notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ── 5. SERVICEABLE PINCODES FULL MANAGEMENT ──────────────────────────────────
ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management pincodes" ON public.serviceable_pincodes;
CREATE POLICY "Admins full management pincodes" ON public.serviceable_pincodes FOR ALL USING (true) WITH CHECK (true);

-- ── 6. ORDERS & ORDER ITEMS FULL MANAGEMENT ──────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management orders" ON public.orders;
CREATE POLICY "Admins full management orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management order_items" ON public.order_items;
CREATE POLICY "Admins full management order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- ── 7. EXCHANGE REQUESTS & ITEMS FULL MANAGEMENT ─────────────────────────────
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management exchanges" ON public.exchange_requests;
CREATE POLICY "Admins full management exchanges" ON public.exchange_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.exchange_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management exchange_items" ON public.exchange_items;
CREATE POLICY "Admins full management exchange_items" ON public.exchange_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.exchange_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management exchange_inspections" ON public.exchange_inspections;
CREATE POLICY "Admins full management exchange_inspections" ON public.exchange_inspections FOR ALL USING (true) WITH CHECK (true);

-- ── 8. WALLETS & LEDGER FULL MANAGEMENT ──────────────────────────────────────
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management wallets" ON public.wallets;
CREATE POLICY "Admins full management wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full management wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Admins full management wallet_transactions" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);

-- ── 9. ATOMIC & IDEMPOTENT EXCHANGE CREDIT ISSUANCE RPC ──────────────────────
DROP FUNCTION IF EXISTS public.approve_exchange_credits(UUID, UUID, NUMERIC, TEXT, INT, INT, NUMERIC, TEXT[], TEXT);
DROP FUNCTION IF EXISTS public.approve_exchange_credits;

CREATE OR REPLACE FUNCTION public.approve_exchange_credits(
  p_exchange_id        UUID,
  p_inspector_id       UUID,
  p_actual_weight_kg   NUMERIC,
  p_grade              TEXT,
  p_accepted_items     INT,
  p_rejected_items     INT     DEFAULT 0,
  p_final_credits      NUMERIC DEFAULT 0,
  p_inspection_photos  TEXT[]  DEFAULT '{}',
  p_notes              TEXT    DEFAULT ''
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exchange  RECORD;
  v_wallet_id UUID;
  v_balance   NUMERIC;
BEGIN
  SELECT er.*
  INTO v_exchange
  FROM exchange_requests er
  WHERE er.id = p_exchange_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REVARA:exchange_not_found:Exchange request % not found', p_exchange_id;
  END IF;

  -- CRITICAL IDEMPOTENCY CHECK: If already issued, do NOT deposit credits again!
  IF v_exchange.status = 'credits_issued' OR v_exchange.status = 'completed' THEN
    SELECT available_credits INTO v_balance FROM wallets WHERE user_id = v_exchange.user_id;
    RETURN jsonb_build_object(
      'status', 'already_processed',
      'message', 'Credits have already been deposited for this exchange request.',
      'credits_issued', v_exchange.final_credits,
      'wallet_balance', v_balance
    );
  END IF;

  -- Validate grade
  IF p_grade NOT IN ('grade_a','grade_b','grade_c','rejected') THEN
    RAISE EXCEPTION 'REVARA:invalid_grade:Grade must be grade_a, grade_b, grade_c, or rejected';
  END IF;

  -- Upsert inspection record
  INSERT INTO exchange_inspections (
    exchange_id, inspector_id, actual_weight_kg, grade,
    accepted_items_count, rejected_items_count, final_credits_issued,
    inspection_photos, inspector_notes, inspected_at
  ) VALUES (
    p_exchange_id, p_inspector_id, p_actual_weight_kg, p_grade::grade_type,
    p_accepted_items, p_rejected_items, p_final_credits,
    p_inspection_photos, p_notes, NOW()
  )
  ON CONFLICT (exchange_id) DO UPDATE SET
    inspector_id         = EXCLUDED.inspector_id,
    actual_weight_kg     = EXCLUDED.actual_weight_kg,
    grade                = EXCLUDED.grade,
    accepted_items_count = EXCLUDED.accepted_items_count,
    rejected_items_count = EXCLUDED.rejected_items_count,
    final_credits_issued = EXCLUDED.final_credits_issued,
    inspection_photos    = EXCLUDED.inspection_photos,
    inspector_notes      = EXCLUDED.inspector_notes,
    inspected_at         = NOW();

  -- Update exchange status to credits_issued
  UPDATE exchange_requests
  SET status        = 'credits_issued',
      final_credits = p_final_credits,
      updated_at    = NOW()
  WHERE id = p_exchange_id;

  -- Deposit credits into wallet (only once!)
  INSERT INTO wallets (user_id, available_credits, total_earned, updated_at)
  VALUES (v_exchange.user_id, p_final_credits, p_final_credits, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET available_credits = wallets.available_credits + p_final_credits,
      total_earned      = wallets.total_earned + p_final_credits,
      updated_at        = NOW();

  SELECT id, available_credits INTO v_wallet_id, v_balance
  FROM wallets WHERE user_id = v_exchange.user_id;

  -- Ledger entry
  INSERT INTO wallet_transactions (
    wallet_id, type, amount, balance_after,
    reference_type, reference_id, description
  ) VALUES (
    v_wallet_id,
    'credit_earned',
    p_final_credits,
    v_balance,
    'exchange',
    p_exchange_id::TEXT,
    'Trade-in credits issued: ' || p_final_credits::TEXT || ' REVARA Credits (Grade: ' || p_grade || ')'
  );

  -- Notification
  INSERT INTO notifications (user_id, title, body, type, reference_type, reference_id)
  VALUES (
    v_exchange.user_id,
    'Trade-In Credits Added! 🎉',
    p_final_credits::TEXT || ' REVARA Credits have been added to your wallet.',
    'credit_issued',
    'exchange',
    p_exchange_id::TEXT
  );

  RETURN jsonb_build_object(
    'status',          'success',
    'credits_issued',  p_final_credits,
    'wallet_balance',  v_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_exchange_credits TO authenticated, anon;


-- ── 9. FIX ORDER_STATUS ENUM CAST IN place_order & EXPAND STORAGE BUCKETS ─────
DROP FUNCTION IF EXISTS place_order(UUID, UUID, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION place_order(
  p_user_id         UUID,
  p_address_id      UUID,
  p_items           JSONB,
  p_subtotal        NUMERIC,
  p_credits_applied NUMERIC  DEFAULT 0,
  p_discount        NUMERIC  DEFAULT 0,
  p_shipping_fee    NUMERIC  DEFAULT 0,
  p_total           NUMERIC  DEFAULT 0,
  p_payment_id      TEXT     DEFAULT NULL,
  p_payment_method  TEXT     DEFAULT 'cod',
  p_coupon_code     TEXT     DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id       UUID;
  v_display_id     TEXT;
  v_item           JSONB;
  v_product        RECORD;
  v_wallet         RECORD;
  v_coupon         RECORD;
  v_coupon_id      UUID    := NULL;
  v_coupon_disc    NUMERIC := 0;
  v_server_total   NUMERIC := 0;
  v_final_total    NUMERIC;
  v_initial_status order_status;
BEGIN
  -- 1. Validate user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'REVARA:user_not_found:User profile not found for id %', p_user_id;
  END IF;

  -- 2. Validate items array not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'REVARA:empty_cart:Order must contain at least one item';
  END IF;

  -- 3. Validate each product exists, is active, has sufficient stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'product_id') IS NULL THEN
      RAISE EXCEPTION 'REVARA:invalid_item:Item is missing product_id';
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
      AND (status = 'active' OR status IS NULL);

    IF NOT FOUND THEN
      RAISE EXCEPTION 'REVARA:product_not_found:Product % not found or not active',
        v_item->>'product_id';
    END IF;

    IF v_product.stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'REVARA:insufficient_stock:Insufficient stock for "%": have %, need %',
        v_product.name, v_product.stock, (v_item->>'quantity')::INT;
    END IF;

    v_server_total := v_server_total + (v_product.price * (v_item->>'quantity')::INT);
  END LOOP;

  -- 4. Validate coupon if provided
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) != '' THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(trim(p_coupon_code))
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit);

    IF FOUND THEN
      v_coupon_id := v_coupon.id;
      IF v_server_total >= COALESCE(v_coupon.min_order_amount, 0) THEN
        IF v_coupon.type = 'percent' THEN
          v_coupon_disc := LEAST(
            v_server_total * (v_coupon.value / 100),
            COALESCE(v_coupon.max_discount, v_server_total)
          );
        ELSIF v_coupon.type = 'flat' THEN
          v_coupon_disc := LEAST(v_coupon.value, v_server_total);
        ELSIF v_coupon.type = 'free_shipping' THEN
          v_coupon_disc := p_shipping_fee;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 5. Validate and deduct credits atomically if used
  IF p_credits_applied > 0 THEN
    IF p_credits_applied > (v_server_total * 0.50) THEN
      RAISE EXCEPTION 'REVARA:credits_cap_exceeded:Credits cannot exceed 50%% of order subtotal';
    END IF;

    SELECT * INTO v_wallet
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'REVARA:wallet_not_found:No wallet found for user %', p_user_id;
    END IF;

    IF v_wallet.available_credits < p_credits_applied THEN
      RAISE EXCEPTION 'REVARA:insufficient_credits:Available credits % < requested %',
        v_wallet.available_credits, p_credits_applied;
    END IF;

    UPDATE wallets
    SET available_credits = available_credits - p_credits_applied,
        total_used        = total_used + p_credits_applied,
        updated_at        = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO wallet_transactions
      (wallet_id, type, amount, balance_after, reference_type, description)
    VALUES (
      v_wallet.id,
      'credit_used',
      p_credits_applied,
      v_wallet.available_credits - p_credits_applied,
      'order',
      'REVARA Credits redeemed at checkout'
    );
  END IF;

  -- 6. Compute final total server-side
  v_final_total := v_server_total
                   - p_credits_applied
                   - p_discount
                   - v_coupon_disc
                   + p_shipping_fee;

  IF v_final_total < 0 THEN v_final_total := 0; END IF;

  -- 7. Generate display order ID
  v_display_id := 'REV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
                  || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));

  IF p_payment_id IS NOT NULL AND trim(p_payment_id) != '' THEN
    v_initial_status := 'confirmed'::order_status;
  ELSE
    v_initial_status := 'placed'::order_status;
  END IF;

  -- 8. Insert order row with explicit order_status enum cast
  INSERT INTO orders (
    user_id, address_id, subtotal, credits_applied, discount,
    shipping_fee, total, status, payment_id, tracking_number
  ) VALUES (
    p_user_id,
    p_address_id,
    v_server_total,
    p_credits_applied,
    p_discount + v_coupon_disc,
    p_shipping_fee,
    v_final_total,
    v_initial_status,
    NULLIF(trim(p_payment_id), ''),
    v_display_id
  ) RETURNING id INTO v_order_id;

  -- 9. Insert order items + deduct stock + log inventory movements
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    INSERT INTO order_items (
      order_id, product_id, product_name, product_image,
      quantity, unit_price, total
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_product.name,
      COALESCE(v_item->>'product_image', (v_product.images)[1]),
      (v_item->>'quantity')::INT,
      v_product.price,
      v_product.price * (v_item->>'quantity')::INT
    );

    UPDATE products
    SET stock      = stock - (v_item->>'quantity')::INT,
        updated_at = NOW()
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO inventory_movements (
      product_id, quantity_change, reason,
      reference_type, reference_id,
      stock_before, stock_after
    ) VALUES (
      (v_item->>'product_id')::UUID,
      -((v_item->>'quantity')::INT),
      'ORDER_FULFILLED',
      'order',
      v_order_id::TEXT,
      v_product.stock,
      v_product.stock - (v_item->>'quantity')::INT
    );
  END LOOP;

  -- 10. Record coupon usage
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_applied)
    VALUES (v_coupon_id, p_user_id, v_order_id, v_coupon_disc)
    ON CONFLICT DO NOTHING;

    UPDATE coupons
    SET usage_count = usage_count + 1
    WHERE id = v_coupon_id;
  END IF;

  -- 11. In-app notification
  INSERT INTO notifications (user_id, title, body, type, reference_type, reference_id)
  VALUES (
    p_user_id,
    'Order Placed: #' || v_display_id,
    'Your order has been placed successfully. We will confirm it shortly.',
    'order_update',
    'order',
    v_order_id::TEXT
  );

  RETURN jsonb_build_object(
    'order_id',    v_order_id,
    'display_id',  v_display_id,
    'total',       v_final_total,
    'status',      'success'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION place_order TO authenticated;
REVOKE EXECUTE ON FUNCTION place_order FROM anon;

-- Ensure all storage buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES
  ('revara-exchange-photos', 'revara-exchange-photos', true),
  ('revara-exchange-videos', 'revara-exchange-videos', true),
  ('revara-products',        'revara-products',        true),
  ('revara-avatars',         'revara-avatars',         true),
  ('revara-review-photos',   'revara-review-photos',   true),
  ('tff-exchange-photos',    'tff-exchange-photos',    true),
  ('tff-exchange-videos',    'tff-exchange-videos',    true),
  ('tff-products',           'tff-products',           true)
ON CONFLICT (id) DO UPDATE SET public = true;
