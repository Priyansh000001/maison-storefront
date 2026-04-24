import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const salesAnalyticsSchema = z.object({
  top_selling_products: z.array(z.object({
    product_id: z.string().nullable().optional(),
    product_name: z.string(),
    units: z.number(),
    revenue: z.number(),
  })),
  least_selling_products: z.array(z.object({
    product_id: z.string().nullable().optional(),
    product_name: z.string(),
    units: z.number(),
    revenue: z.number(),
  })),
  category_revenue: z.array(z.object({
    category_slug: z.string(),
    category_name: z.string(),
    revenue: z.number(),
  })),
  daily_revenue: z.array(z.object({
    day: z.string(),
    revenue: z.number(),
    orders: z.number(),
  })),
  low_stock_alerts: z.array(z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    stock: z.number(),
  })),
});

export type SalesAnalytics = z.infer<typeof salesAnalyticsSchema>;

export async function getSalesAnalytics(days = 30): Promise<SalesAnalytics> {
  const { data, error } = await supabase.rpc("get_sales_analytics", { p_days: days });
  if (error) throw new Error(error.message);

  const parsed = salesAnalyticsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid analytics payload");
  }
  return parsed.data;
}
