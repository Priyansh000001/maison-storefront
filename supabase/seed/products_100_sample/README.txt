Maison — 100 Additional Products
=================================
This pack adds 100 NEW products to the existing 44, IDs p045 through p144.
No overlap with the previous dataset — safe to import alongside it.

Files
-----
  products.csv               100 product rows
  products_100_sample.xlsx   Same data + Summary tab with auto-formulas
  README.txt                 This file

Schema (Supabase / Postgres ready)
----------------------------------
id (text, PK)            e.g. p045
slug (text, unique)
name (text)
description (text)
price (numeric)
category_id (text, FK -> categories.id)   c1..c6
image_url (text)
sizes (jsonb)            JSON array, e.g. ["S","M","L"]
colors (jsonb)           JSON array
stock (int)
is_featured (boolean)
rating (numeric)         3.5 - 5.0
created_at (timestamptz)

Category mix
------------
  c1 Woman, c2 Man, c3 Accessories, c4 Shoes, c5 Kids, c6 Beauty

Import
------
  COPY products FROM '/path/products.csv' WITH CSV HEADER;
