-- Harden checkout: enforce server-side pricing/stock validation and atomic order writes.

-- 1) Block direct client inserts for orders and order_items.
DROP POLICY IF EXISTS "Anyone can place order" ON public.orders;
DROP POLICY IF EXISTS "Insert order items for own order" ON public.order_items;

-- 2) Reservation and audit tables.
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'released')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reservations"
ON public.inventory_reservations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users view own audit logs"
ON public.audit_logs
FOR SELECT
USING (
  actor_user_id = auth.uid()
  OR (metadata ? 'user_id' AND (metadata->>'user_id')::uuid = auth.uid())
);

-- 3) Atomic order placement with trusted server-side price computation.
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_email TEXT,
  p_full_name TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_country TEXT,
  p_items JSONB,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_product_id UUID;
  v_quantity INT;
  v_size TEXT;
  v_color TEXT;
  v_total NUMERIC(10,2) := 0;
  v_expires_at TIMESTAMPTZ := now() + INTERVAL '15 minutes';
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF p_email IS NULL OR p_full_name IS NULL OR p_address IS NULL OR p_city IS NULL OR p_postal_code IS NULL OR p_country IS NULL THEN
    RAISE EXCEPTION 'Missing required checkout fields';
  END IF;

  -- Pre-validate and compute authoritative total from DB prices.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 0);

    IF v_product_id IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item payload';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (available %, requested %)', v_product.slug, v_product.stock, v_quantity;
    END IF;

    v_total := v_total + (v_product.price * v_quantity);
  END LOOP;

  INSERT INTO public.orders (
    user_id,
    email,
    full_name,
    address,
    city,
    postal_code,
    country,
    total,
    status
  )
  VALUES (
    p_user_id,
    trim(p_email),
    trim(p_full_name),
    trim(p_address),
    trim(p_city),
    trim(p_postal_code),
    trim(p_country),
    v_total,
    'pending_payment'
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_size := NULLIF(trim(v_item->>'size'), '');
    v_color := NULLIF(trim(v_item->>'color'), '');

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      size,
      color,
      quantity,
      unit_price
    )
    VALUES (
      v_order.id,
      v_product.id,
      v_product.name,
      v_size,
      v_color,
      v_quantity,
      v_product.price
    );

    UPDATE public.products
    SET stock = stock - v_quantity
    WHERE id = v_product.id;

    INSERT INTO public.inventory_reservations (
      order_id,
      product_id,
      quantity,
      status,
      expires_at
    )
    VALUES (
      v_order.id,
      v_product.id,
      v_quantity,
      'active',
      v_expires_at
    );
  END LOOP;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    p_user_id,
    'order_created',
    'order',
    v_order.id,
    jsonb_build_object('order_id', v_order.id, 'user_id', p_user_id, 'total', v_total)
  );

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'total', v_order.total,
    'status', v_order.status,
    'reservation_expires_at', v_expires_at
  );
END;
$$;

-- 4) Payment confirmation / reservation finalization.
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id UUID,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.orders
  SET status = 'paid'
  WHERE id = p_order_id;

  UPDATE public.inventory_reservations
  SET status = 'confirmed'
  WHERE order_id = p_order_id
    AND status = 'active';

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_order.user_id,
    'order_paid',
    'order',
    p_order_id,
    jsonb_build_object('order_id', p_order_id, 'payment_reference', p_payment_reference)
  );
END;
$$;

-- 5) Release timed-out reservations (to run from a scheduled job).
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  FOR r IN
    SELECT id, order_id, product_id, quantity
    FROM public.inventory_reservations
    WHERE status = 'active'
      AND expires_at <= now()
    FOR UPDATE
  LOOP
    UPDATE public.products
    SET stock = stock + r.quantity
    WHERE id = r.product_id;

    UPDATE public.inventory_reservations
    SET status = 'released'
    WHERE id = r.id;

    UPDATE public.orders
    SET status = 'expired'
    WHERE id = r.order_id
      AND status = 'pending_payment';

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 6) Analytics function (for dashboard API consumption).
CREATE OR REPLACE FUNCTION public.get_sales_analytics(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH scoped_orders AS (
  SELECT *
  FROM public.orders
  WHERE created_at >= now() - make_interval(days => GREATEST(p_days, 1))
    AND status IN ('pending_payment', 'paid')
),
item_sales AS (
  SELECT
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity) AS units,
    SUM(oi.quantity * oi.unit_price) AS revenue
  FROM public.order_items oi
  JOIN scoped_orders o ON o.id = oi.order_id
  GROUP BY oi.product_id, oi.product_name
),
category_sales AS (
  SELECT
    c.slug AS category_slug,
    c.name AS category_name,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric AS revenue
  FROM public.categories c
  LEFT JOIN public.products p ON p.category_id = c.id
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  LEFT JOIN scoped_orders o ON o.id = oi.order_id
  GROUP BY c.slug, c.name
),
daily_revenue AS (
  SELECT
    date_trunc('day', created_at)::date AS day,
    SUM(total)::numeric AS revenue,
    COUNT(*)::int AS orders
  FROM scoped_orders
  GROUP BY 1
  ORDER BY 1
),
low_stock AS (
  SELECT id, slug, name, stock
  FROM public.products
  WHERE stock <= 5
  ORDER BY stock ASC, name
)
SELECT jsonb_build_object(
  'top_selling_products', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT product_id, product_name, units, revenue
    FROM item_sales
    ORDER BY units DESC, revenue DESC
    LIMIT 10
  ) x), '[]'::jsonb),
  'least_selling_products', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT product_id, product_name, units, revenue
    FROM item_sales
    ORDER BY units ASC, revenue ASC
    LIMIT 10
  ) x), '[]'::jsonb),
  'category_revenue', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT category_slug, category_name, revenue
    FROM category_sales
    ORDER BY revenue DESC
  ) x), '[]'::jsonb),
  'daily_revenue', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT day, revenue, orders
    FROM daily_revenue
  ) x), '[]'::jsonb),
  'low_stock_alerts', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT id, slug, name, stock
    FROM low_stock
  ) x), '[]'::jsonb)
);
$$;

REVOKE ALL ON FUNCTION public.place_order_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_sales_analytics(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sales_analytics(INT) TO authenticated;
