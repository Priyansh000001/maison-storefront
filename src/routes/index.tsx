import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { resolveProductImage, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import collectionKnitwear from "@/assets/collection-knitwear.jpg";
import collectionAccessories from "@/assets/collection-accessories.jpg";
import collectionMen from "@/assets/collection-men.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison — Spring/Summer Collection" },
      { name: "description", content: "Discover the new Maison Spring/Summer collection. Editorial luxury essentials, crafted in Europe." },
      { property: "og:title", content: "Maison — Spring/Summer Collection" },
      { property: "og:description", content: "Editorial luxury essentials, crafted in Europe." },
    ],
  }),
  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data as unknown as Product[]);
      });
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[100svh] w-full overflow-hidden -mt-16 md:-mt-20">
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          src={hero1}
          alt="Maison Spring Summer Campaign"
          width={1080}
          height={1920}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/55 via-foreground/25 to-foreground/35" />
        <div className="relative z-10 h-full flex flex-col justify-end pb-16 md:pb-24 px-5 md:px-10">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="eyebrow text-background/95 mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
          >
            Spring · Summer 2025
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 1 }}
            className="font-display text-5xl md:text-8xl lg:text-[10rem] leading-[0.95] text-background drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] max-w-5xl"
          >
            The art of <em className="italic">restraint.</em>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-10 flex gap-4"
          >
            <Link
              to="/woman"
              className="bg-background text-foreground px-8 py-4 eyebrow hover:bg-background/90 transition"
            >
              Shop Woman
            </Link>
            <Link
              to="/man"
              className="border border-background text-background px-8 py-4 eyebrow hover:bg-background hover:text-foreground transition"
            >
              Shop Man
            </Link>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y hairline overflow-hidden py-5">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0">
              {["Free shipping over €150", "Crafted in Europe", "Complimentary returns", "New collection arriving weekly", "Members access"].map((t, i) => (
                <span key={`${k}-${i}`} className="eyebrow mx-12 text-muted-foreground">— {t}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* EDITORIAL SPLIT */}
      <section className="grid md:grid-cols-2 gap-px bg-border">
        <Link to="/woman" className="group relative bg-background overflow-hidden img-zoom block">
          <img src={hero2} alt="Woman" loading="lazy" className="w-full h-[80vh] md:h-[90vh] object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end p-10 bg-gradient-to-t from-foreground/40 via-transparent">
            <p className="eyebrow text-background mb-2">New In</p>
            <h2 className="font-display text-5xl md:text-7xl text-background">Woman</h2>
            <span className="eyebrow text-background mt-4 link-underline w-fit">Discover</span>
          </div>
        </Link>
        <Link to="/man" className="group relative bg-background overflow-hidden img-zoom block">
          <img src={collectionMen} alt="Man" loading="lazy" className="w-full h-[80vh] md:h-[90vh] object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end p-10 bg-gradient-to-t from-foreground/40 via-transparent">
            <p className="eyebrow text-background mb-2">Tailoring</p>
            <h2 className="font-display text-5xl md:text-7xl text-background">Man</h2>
            <span className="eyebrow text-background mt-4 link-underline w-fit">Discover</span>
          </div>
        </Link>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 md:py-32 px-5 md:px-10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow text-muted-foreground mb-3">Édition Limitée</p>
            <h2 className="font-display text-4xl md:text-6xl">Featured pieces</h2>
          </div>
          <Link to="/woman" className="hidden md:inline-block eyebrow link-underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-12">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* COLLECTIONS GRID */}
      <section className="px-5 md:px-10 pb-24">
        <p className="eyebrow text-muted-foreground mb-3">Categories</p>
        <h2 className="font-display text-4xl md:text-6xl mb-12">Shop by collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { img: collectionKnitwear, label: "Knitwear", to: "/woman" as const },
            { img: collectionAccessories, label: "Accessories", to: "/accessories" as const },
            { img: collectionMen, label: "Tailoring", to: "/man" as const },
          ].map((c) => (
            <Link key={c.label} to={c.to} className="group img-zoom block">
              <img src={c.img} alt={c.label} loading="lazy" className="w-full aspect-[3/4] object-cover" />
              <div className="flex justify-between items-baseline mt-4">
                <h3 className="font-display text-2xl">{c.label}</h3>
                <span className="eyebrow link-underline">Shop</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-32 px-5 md:px-10 max-w-5xl mx-auto text-center">
        <p className="eyebrow text-muted-foreground mb-6">The House</p>
        <p className="font-display text-3xl md:text-5xl leading-tight">
          We believe in pieces that outlast trends — cut from the finest European mills,
          finished by hand, designed to be worn, washed, lived in, and loved.
        </p>
        <Link to="/about" className="inline-block eyebrow link-underline mt-10">
          Read our manifesto
        </Link>
      </section>
    </>
  );
}
