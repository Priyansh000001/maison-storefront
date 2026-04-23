import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

const CATEGORY_META: Record<string, { title: string; tagline: string }> = {
  woman: { title: "Woman", tagline: "Spring · Summer 2025" },
  man: { title: "Man", tagline: "Tailoring & Essentials" },
  accessories: { title: "Accessories", tagline: "Leather & Hardware" },
  shoes: { title: "Shoes", tagline: "Crafted in Italy" },
};

export const Route = createFileRoute("/$category")({
  loader: async ({ params }) => {
    if (!CATEGORY_META[params.category]) throw notFound();
    return { slug: params.category };
  },
  head: ({ params }) => {
    const meta = CATEGORY_META[params.category];
    if (!meta) return { meta: [] };
    return {
      meta: [
        { title: `${meta.title} — Maison` },
        { name: "description", content: `Shop the new ${meta.title} collection at Maison. ${meta.tagline}.` },
        { property: "og:title", content: `${meta.title} — Maison` },
        { property: "og:description", content: meta.tagline },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useLoaderData();
  const meta = CATEGORY_META[slug];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat || !active) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", (cat as Category).id);
      if (!active) return;
      setProducts((data as unknown as Product[]) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return 0;
  });

  return (
    <>
      <section className="px-5 md:px-10 pt-12 pb-10 border-b hairline">
        <p className="eyebrow text-muted-foreground mb-4">{meta.tagline}</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <h1 className="font-display text-5xl md:text-7xl">{meta.title}</h1>
          <div className="flex items-center gap-6">
            <span className="eyebrow text-muted-foreground">{products.length} items</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="eyebrow bg-transparent border-b border-foreground py-1 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 py-12 md:py-16">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-secondary aspect-[3/4] mb-4" />
                <div className="h-3 bg-secondary w-2/3 mb-2" />
                <div className="h-3 bg-secondary w-1/3" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-display text-3xl mb-3">No pieces yet</p>
            <p className="text-sm text-muted-foreground">Check back soon for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
            {sorted.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
