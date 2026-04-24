import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";

const checkoutSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(120),
  address: z.string().min(5).max(240),
  city: z.string().min(2).max(120),
  postal_code: z.string().min(2).max(32),
  country: z.string().min(2).max(120),
});

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
  size: z.string().min(1).max(16),
  color: z.string().min(1).max(32),
});

const placeOrderResponseSchema = z.object({
  order_id: z.string().uuid(),
  total: z.number(),
  status: z.string(),
  reservation_expires_at: z.string(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PlaceOrderResult = z.infer<typeof placeOrderResponseSchema>;

function toRpcItems(items: CartItem[]) {
  return items.map((it) =>
    orderItemSchema.parse({
      productId: it.productId,
      quantity: it.quantity,
      size: it.size,
      color: it.color,
    })
  );
}

export async function placeOrderAtomic(input: CheckoutInput, items: CartItem[]): Promise<PlaceOrderResult> {
  const form = checkoutSchema.parse(input);
  if (items.length === 0) {
    throw new Error("Cart is empty");
  }

  const rpcItems = toRpcItems(items).map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
    size: i.size,
    color: i.color,
  }));

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("place_order_atomic", {
    p_email: form.email,
    p_full_name: form.full_name,
    p_address: form.address,
    p_city: form.city,
    p_postal_code: form.postal_code,
    p_country: form.country,
    p_items: rpcItems,
    p_user_id: userData.user?.id ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const parsed = placeOrderResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Unexpected order response from backend");
  }

  return parsed.data;
}
