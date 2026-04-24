Maison E-commerce — Sample Dataset (200+ orders)
=================================================
Generated for testing analytics dashboards, seeding databases,
and demoing the Maison / Zara-inspired storefront.

Files included
--------------
  categories.csv      6 rows
  products.csv       44 rows
  users.csv          40 rows
  orders.csv        200 rows   <-- main dataset (200 orders)
  order_items.csv   486 rows   (line items belonging to the 200 orders)
  reviews.csv       150 rows
  maison_sample_dataset.xlsx   All tables in one Excel workbook + Summary sheet

Schema (matches the Supabase migration in the project)
------------------------------------------------------
categories(id, slug, name, display_order)
products(id, slug, name, description, price, category_id, image_url,
         sizes[json], colors[json], stock, is_featured, created_at)
users(id, full_name, email, city, country, created_at)
orders(id, user_id, email, full_name, address, city, postal_code, country,
       subtotal, shipping, tax, total, status, payment_method, created_at)
order_items(id, order_id, product_id, product_name, size, color,
            quantity, unit_price, line_total)
reviews(id, product_id, user_id, rating, title, comment, created_at)

Relationships
-------------
  products.category_id  -> categories.id
  orders.user_id        -> users.id
  order_items.order_id  -> orders.id
  order_items.product_id-> products.id
  reviews.product_id    -> products.id
  reviews.user_id       -> users.id

Order status distribution (weighted, realistic):
  paid 60% · shipped 20% · delivered 10% · pending 6% · cancelled 3% · refunded 1%

How to use
----------
1. Open maison_sample_dataset.xlsx for an instant overview (Summary tab has totals & AOV).
2. Import the CSVs into Supabase / Postgres / Lovable Cloud:
     COPY products FROM '/path/products.csv' WITH CSV HEADER;
   ... and so on, in this order:
     categories -> products -> users -> orders -> order_items -> reviews
3. For Postgres JSONB columns (sizes, colors), values are already valid JSON arrays.
