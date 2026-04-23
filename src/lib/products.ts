// Maps product slugs to bundled image imports so prod builds work correctly.
import coat from "@/assets/product-coat.jpg";
import dress from "@/assets/product-dress.jpg";
import knit from "@/assets/product-knit.jpg";
import trousers from "@/assets/product-trousers.jpg";
import shirt from "@/assets/product-shirt.jpg";
import bag from "@/assets/product-bag.jpg";
import miniBag from "@/assets/product-mini-bag.jpg";
import boots from "@/assets/product-boots.jpg";

export const productImageMap: Record<string, string> = {
  "oversized-wool-coat": coat,
  "silk-slip-dress": dress,
  "cashmere-turtleneck": knit,
  "wide-leg-trousers": trousers,
  "poplin-shirt": shirt,
  "leather-tote": bag,
  "mini-chain-bag": miniBag,
  "pointed-chelsea-boots": boots,
};

export function resolveProductImage(slug: string, fallback?: string): string {
  return productImageMap[slug] ?? fallback ?? "";
}

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  image_url: string;
  sizes: string[];
  colors: string[];
  stock: number;
  is_featured: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};
