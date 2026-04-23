import { Link } from "@tanstack/react-router";
import { resolveProductImage, type Product } from "@/lib/products";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const img = resolveProductImage(product.slug, product.image_url);
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block reveal"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="img-zoom bg-secondary aspect-[3/4] mb-4">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex justify-between items-baseline gap-3">
        <h3 className="text-sm font-normal tracking-wide">{product.name}</h3>
        <span className="text-sm tabular-nums shrink-0">€{Number(product.price).toFixed(2)}</span>
      </div>
      {product.colors?.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">{product.colors.join(" · ")}</p>
      )}
    </Link>
  );
}
