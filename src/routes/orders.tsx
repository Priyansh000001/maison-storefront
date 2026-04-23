import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Order = {
  id: string;
  created_at: string;
  total: number;
  status: string;
  full_name: string;
  city: string;
  country: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
};

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Maison" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      const { data: ord } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      const orderList = (ord as Order[]) || [];
      setOrders(orderList);
      if (orderList.length) {
        const { data: itemRows } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderList.map((o) => o.id));
        const grouped: Record<string, OrderItem[]> = {};
        for (const it of (itemRows as OrderItem[]) || []) {
          (grouped[it.order_id] ??= []).push(it);
        }
        setItems(grouped);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-[60vh]" />;

  if (!signedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-5">
        <div>
          <p className="font-display text-3xl mb-3">Sign in to view orders</p>
          <Link to="/account" className="eyebrow link-underline">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 md:px-10 py-16 md:py-24 max-w-4xl mx-auto">
      <p className="eyebrow text-muted-foreground mb-3">Your history</p>
      <h1 className="font-display text-5xl md:text-6xl mb-12">Orders</h1>

      {orders.length === 0 ? (
        <div className="py-20 text-center border-t hairline">
          <p className="text-sm text-muted-foreground mb-6">No orders yet.</p>
          <Link to="/woman" className="eyebrow link-underline">Start shopping</Link>
        </div>
      ) : (
        <div className="border-t hairline">
          {orders.map((o) => (
            <div key={o.id} className="py-8 border-b hairline">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
                <div>
                  <p className="eyebrow text-muted-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(o.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums">€{Number(o.total).toFixed(2)}</p>
                  <p className="eyebrow text-muted-foreground">{o.status}</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {(items[o.id] || []).map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.quantity} × {it.product_name} {it.size ? `(${it.size})` : ""}</span>
                    <span className="tabular-nums">€{(Number(it.unit_price) * it.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
