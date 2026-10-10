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
