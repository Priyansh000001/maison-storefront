import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveProductImage, type Product } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import { kMeans } from "@/lib/kmeans";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Maison` },
    ],
  }),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clusterItems, setClusterItems] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (!data) {
          throw notFound();
        }
        const p = data as unknown as Product;
        setProduct(p);
        setColor(p.colors?.[0] ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    let active = true;

    supabase
      .from("products")
      .select("*")
      .then(({ data }) => {
        if (!active || !data) return;
        const all = data as unknown as Product[];
        if (all.length < 2) {
          setClusterItems([]);
          return;
        }

        // Numeric embedding for lightweight merchandising analysis.
        const vectors = all.map((p) => [
          Number(p.price),
          Number(p.stock),
          p.is_featured ? 1 : 0,
          p.sizes?.length ?? 0,
          p.colors?.length ?? 0,
        ]);

        const { assignments } = kMeans(vectors, 3);
        const currentIndex = all.findIndex((p) => p.id === product.id);
        if (currentIndex < 0) return;
        const clusterId = assignments[currentIndex];
        const peers = all.filter((p, i) => assignments[i] === clusterId && p.id !== product.id).slice(0, 4);
        setClusterItems(peers);
      });

    return () => {
      active = false;
    };
  }, [product]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-px bg-border min-h-screen">
        <div className="bg-secondary animate-pulse" />
        <div className="bg-background p-10 space-y-6">
          <div className="h-4 bg-secondary w-1/4" />
          <div className="h-10 bg-secondary w-3/4" />
          <div className="h-6 bg-secondary w-1/4" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-5 md:px-10 py-32 text-center">
        <p className="font-display text-3xl">Product not found</p>
      </div>
    );
  }

  const img = resolveProductImage(product.slug, product.image_url);

  const handleAdd = () => {
    if (!size) {
      setErr("Please select a size");
      return;
    }
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      size,
      color: color ?? "",
      quantity: 1,
      image: img,
    });
    setErr(null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="grid md:grid-cols-[1.2fr_1fr] gap-px bg-border">
      {/* IMAGES */}
      <div className="bg-secondary">
        <motion.img
          key={img}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          src={img}
          alt={product.name}
          className="w-full h-auto md:h-[calc(100vh-5rem)] md:sticky md:top-20 object-cover"
        />
      </div>

      {/* DETAILS */}
      <div className="bg-background p-6 md:p-12 lg:p-16">
        <div className="md:sticky md:top-20 max-w-md">
          <Link
            to="/woman"
            className="eyebrow text-muted-foreground hover:text-foreground link-underline"
          >
            ← Back to collection
          </Link>

          <h1 className="font-display text-4xl md:text-5xl mt-8 mb-4">{product.name}</h1>
          <p className="text-xl tabular-nums mb-8">€{Number(product.price).toFixed(2)}</p>

          <p className="text-sm text-muted-foreground leading-relaxed mb-10">
            {product.description}
          </p>

          {product.colors?.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow">Color</span>
                <span className="text-xs text-muted-foreground">{color}</span>
              </div>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`px-4 py-2 text-xs border transition ${
                      color === c ? "border-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="eyebrow">Size</span>
                <button className="eyebrow text-muted-foreground hover:text-foreground link-underline">
                  Size guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setErr(null);
                    }}
                    className={`py-3 text-xs border transition ${
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {err && <p className="text-xs text-destructive mb-3">{err}</p>}

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAdd}
              className="flex-1 bg-foreground text-background py-4 eyebrow flex items-center justify-center gap-2 hover:bg-foreground/90 transition"
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" /> Added
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    Add to bag
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button className="border border-foreground p-4" aria-label="Wishlist">
              <Heart className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-10">
            {product.stock > 5
              ? "In stock"
              : product.stock > 0
              ? `Only ${product.stock} left`
              : "Out of stock"}
          </p>

          <div className="space-y-4 border-t hairline pt-6">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Truck className="h-4 w-4" strokeWidth={1.25} /> Free shipping over €150
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <RotateCcw className="h-4 w-4" strokeWidth={1.25} /> Complimentary returns within 30 days
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.25} /> Secure encrypted checkout
            </div>
          </div>

          {clusterItems.length > 0 && (
            <div className="mt-10 border-t hairline pt-6">
              <p className="eyebrow mb-4">Similar picks (K-Means)</p>
              <div className="space-y-3">
                {clusterItems.map((item) => (
                  <Link
                    key={item.id}
                    to="/product/$slug"
                    params={{ slug: item.slug }}
                    className="flex items-center justify-between text-sm border-b hairline pb-3 hover:opacity-75 transition"
                  >
                    <span>{item.name}</span>
                    <span className="tabular-nums">€{Number(item.price).toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
