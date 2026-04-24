import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('supabase/seed/maison_sample_dataset');
const outFile = path.resolve('supabase/seed/maison_sample_seed.sql');

function parseCSV(content) {
  const rows = [];
  let row = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ',') {
      row.push(cell);
      cell = '';
      i += 1;
      continue;
    }

    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
      continue;
    }

    if (ch === '\r') {
      i += 1;
      continue;
    }

    cell += ch;
    i += 1;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).filter((r) => r.length && r.some((c) => c !== '')).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? '';
    });
    return obj;
  });
}

function q(str) {
  return `'${String(str).replace(/'/g, "''")}'`;
}

function uuidExpr(prefix, id) {
  return `public.text_to_uuid(${q(`${prefix}:${id}`)})`;
}

const categories = parseCSV(fs.readFileSync(path.join(dataDir, 'categories.csv'), 'utf8'));
const products = parseCSV(fs.readFileSync(path.join(dataDir, 'products.csv'), 'utf8'));
const orders = parseCSV(fs.readFileSync(path.join(dataDir, 'orders.csv'), 'utf8'));
const orderItems = parseCSV(fs.readFileSync(path.join(dataDir, 'order_items.csv'), 'utf8'));

let sql = '';
sql += '-- Generated from supabase/seed/maison_sample_dataset/*.csv\n';
sql += '-- Seeds categories, products, orders, order_items in UUID-compatible format.\n\n';
sql += 'BEGIN;\n\n';
sql += 'CREATE OR REPLACE FUNCTION public.text_to_uuid(input text)\n';
sql += 'RETURNS uuid\n';
sql += 'LANGUAGE sql\n';
sql += 'IMMUTABLE\n';
sql += 'AS $$\n';
sql += "  SELECT (substr(md5(input),1,8)||'-'||substr(md5(input),9,4)||'-'||substr(md5(input),13,4)||'-'||substr(md5(input),17,4)||'-'||substr(md5(input),21,12))::uuid;\n";
sql += '$$;\n\n';

sql += '-- Categories\n';
for (const c of categories) {
  sql += `INSERT INTO public.categories (id, slug, name, display_order) VALUES (${uuidExpr('category', c.id)}, ${q(c.slug)}, ${q(c.name)}, ${Number(c.display_order || 0)}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order;\n`;
}

sql += '\n-- Products\n';
for (const p of products) {
  const featured = /^(true|1)$/i.test(String(p.is_featured)) ? 'true' : 'false';
  sql += `INSERT INTO public.products (id, slug, name, description, price, category_id, image_url, sizes, colors, stock, is_featured, created_at) VALUES (`;
  sql += `${uuidExpr('product', p.id)}, ${q(p.slug)}, ${q(p.name)}, ${q(p.description)}, ${Number(p.price || 0).toFixed(2)}, ${uuidExpr('category', p.category_id)}, ${q(p.image_url)}, ${q(p.sizes)}::jsonb, ${q(p.colors)}::jsonb, ${Number(p.stock || 0)}, ${featured}, ${q(p.created_at)}::timestamptz`;
  sql += `) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url, sizes = EXCLUDED.sizes, colors = EXCLUDED.colors, stock = EXCLUDED.stock, is_featured = EXCLUDED.is_featured, created_at = EXCLUDED.created_at;\n`;
}

sql += '\n-- Orders (user_id intentionally set NULL because source users are not auth.users)\n';
for (const o of orders) {
  sql += `INSERT INTO public.orders (id, user_id, email, full_name, address, city, postal_code, country, total, status, created_at) VALUES (`;
  sql += `${uuidExpr('order', o.id)}, NULL, ${q(o.email)}, ${q(o.full_name)}, ${q(o.address)}, ${q(o.city)}, ${q(o.postal_code)}, ${q(o.country)}, ${Number(o.total || 0).toFixed(2)}, ${q(o.status)}, ${q(o.created_at)}::timestamptz`;
  sql += `) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += '\n-- Order items\n';
for (const oi of orderItems) {
  sql += `INSERT INTO public.order_items (id, order_id, product_id, product_name, size, color, quantity, unit_price) VALUES (`;
  sql += `${uuidExpr('order_item', oi.id)}, ${uuidExpr('order', oi.order_id)}, ${uuidExpr('product', oi.product_id)}, ${q(oi.product_name)}, ${q(oi.size)}, ${q(oi.color)}, ${Number(oi.quantity || 0)}, ${Number(oi.unit_price || 0).toFixed(2)}`;
  sql += `) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += '\nCOMMIT;\n';

fs.writeFileSync(outFile, sql, 'utf8');
console.log(`Seed SQL generated: ${outFile}`);
console.log(`Rows -> categories: ${categories.length}, products: ${products.length}, orders: ${orders.length}, order_items: ${orderItems.length}`);
