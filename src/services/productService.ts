import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/products";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Product | null) ?? null;
}

export async function getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
  const { data: cat, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();
  if (catError) throw new Error(catError.message);
  if (!cat?.id) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data as Product[]) ?? [];
}
