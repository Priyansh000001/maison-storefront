import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Manifesto — Maison" },
      { name: "description", content: "Maison believes in pieces that outlast trends. Crafted in Europe, designed to live in." },
      { property: "og:title", content: "Our Manifesto — Maison" },
      { property: "og:description", content: "Crafted in Europe. Designed to live in." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="px-5 md:px-10 py-16 md:py-24 max-w-3xl mx-auto">
      <p className="eyebrow text-muted-foreground mb-3">Manifesto</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-12">
        Less, but <em className="italic">better.</em>
      </h1>
      <div className="space-y-8 text-base md:text-lg leading-relaxed text-muted-foreground">
        <p>
          Maison was founded on a simple idea — that clothing should outlast the season,
          and that restraint is the highest form of luxury. We work with the same family-owned
          mills in Italy, France, and Portugal that have shaped European wardrobes for generations.
        </p>
        <p>
          Every piece is conceived as part of a single coherent wardrobe. Tailoring that softens
          with wear. Knitwear that asks for nothing. Leather that records the life of its owner.
        </p>
        <p>
          We release small collections, hold them in respect, and refuse to chase the calendar.
        </p>
      </div>
      <div className="mt-16">
        <Link to="/" className="eyebrow link-underline">← Return home</Link>
      </div>
    </div>
  );
}
