ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_rating_range_check;

ALTER TABLE public.products
ADD CONSTRAINT products_rating_range_check CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
