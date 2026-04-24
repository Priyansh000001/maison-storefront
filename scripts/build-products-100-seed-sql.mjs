import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('supabase/seed/products_100_sample');
const outFile = path.resolve('supabase/seed/products_100_seed.sql');

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
  return rows
    .slice(1)
    .filter((r) => r.length && r.some((c) => c !== ''))
    .map((r) => {
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

const products = parseCSV(fs.readFileSync(path.join(dataDir, 'products.csv'), 'utf8'));

let sql = '';
sql += '-- Generated from supabase/seed/products_100_sample/products.csv\n';
sql += '-- Adds/updates 100 additional products (p045..p144).\n\n';
sql += 'BEGIN;\n\n';
sql += 'CREATE OR REPLACE FUNCTION public.text_to_uuid(input text)\n';
sql += 'RETURNS uuid\n';
sql += 'LANGUAGE sql\n';
sql += 'IMMUTABLE\n';
sql += 'AS $$\n';
sql += "  SELECT (substr(md5(input),1,8)||'-'||substr(md5(input),9,4)||'-'||substr(md5(input),13,4)||'-'||substr(md5(input),17,4)||'-'||substr(md5(input),21,12))::uuid;\n";
sql += '$$;\n\n';

for (const p of products) {
  const featured = /^(true|1)$/i.test(String(p.is_featured)) ? 'true' : 'false';
  const rating = p.rating && String(p.rating).trim() !== '' ? Number(p.rating).toFixed(1) : 'NULL';
  sql += `INSERT INTO public.products (id, slug, name, description, price, category_id, image_url, sizes, colors, stock, is_featured, rating, created_at) VALUES (`;
  sql += `${uuidExpr('product', p.id)}, ${q(p.slug)}, ${q(p.name)}, ${q(p.description)}, ${Number(p.price || 0).toFixed(2)}, ${uuidExpr('category', p.category_id)}, ${q(p.image_url)}, ${q(p.sizes)}::jsonb, ${q(p.colors)}::jsonb, ${Number(p.stock || 0)}, ${featured}, ${rating}, ${q(p.created_at)}::timestamptz`;
  sql += `) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url, sizes = EXCLUDED.sizes, colors = EXCLUDED.colors, stock = EXCLUDED.stock, is_featured = EXCLUDED.is_featured, rating = EXCLUDED.rating, created_at = EXCLUDED.created_at;\n`;
}

sql += '\nCOMMIT;\n';

fs.writeFileSync(outFile, sql, 'utf8');
console.log(`Seed SQL generated: ${outFile}`);
console.log(`Rows -> products: ${products.length}`);
