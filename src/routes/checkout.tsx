import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useCart, clearCart } from "@/lib/cart";
import { placeOrderAtomic } from "@/services/orderService";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Maison" },
      { name: "description", content: "Complete your Maison order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 12;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "France",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setErr(null);
    try {
      const order = await placeOrderAtomic(form, items);

      clearCart();
      setDone(order.order_id);
      setServerTotal(order.total);
      setTimeout(() => navigate({ to: "/" }), 4000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not place order";
      setErr(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-md"
        >
          <div className="w-14 h-14 mx-auto rounded-full border border-foreground flex items-center justify-center mb-8">
            <Check className="h-6 w-6" strokeWidth={1.25} />
          </div>
          <p className="eyebrow text-muted-foreground mb-4">Order confirmed</p>
          <h1 className="font-display text-4xl md:text-5xl mb-6">Thank you.</h1>
          <p className="text-sm text-muted-foreground mb-10">
            A confirmation has been sent to {form.email}.<br />
            Order reference: <span className="tabular-nums">{done.slice(0, 8).toUpperCase()}</span><br />
            Total charged: <span className="tabular-nums">€{Number(serverTotal ?? 0).toFixed(2)}</span>
          </p>
          <Link to="/" className="eyebrow link-underline">
            Continue shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-5">
        <div>
          <p className="font-display text-3xl mb-3">Your bag is empty</p>
          <Link to="/woman" className="eyebrow link-underline">
            Discover the collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-px bg-border min-h-screen">
      <div className="bg-background p-6 md:p-12 lg:p-16">
        <p className="eyebrow text-muted-foreground mb-3">Step 1 of 1</p>
        <h1 className="font-display text-4xl md:text-5xl mb-12">Checkout</h1>

        <form onSubmit={submit} className="max-w-lg space-y-8">
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-3">Contact</legend>
            <Field label="Email" type="email" value={form.email} onChange={(v) => onChange("email", v)} />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="eyebrow mb-3">Shipping address</legend>
            <Field label="Full name" value={form.full_name} onChange={(v) => onChange("full_name", v)} />
            <Field label="Address" value={form.address} onChange={(v) => onChange("address", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" value={form.city} onChange={(v) => onChange("city", v)} />
              <Field label="Postal code" value={form.postal_code} onChange={(v) => onChange("postal_code", v)} />
            </div>
            <Field label="Country" value={form.country} onChange={(v) => onChange("country", v)} />
          </fieldset>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background py-4 eyebrow disabled:opacity-50"
          >
            {submitting ? "Processing..." : `Place order · €${total.toFixed(2)}`}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Demo checkout — no payment is taken.
          </p>
        </form>
      </div>

      <aside className="bg-secondary p-6 md:p-12">
        <p className="eyebrow text-muted-foreground mb-6">Order summary</p>
        <ul className="space-y-5 mb-8">
          {items.map((it) => (
            <li key={`${it.productId}-${it.size}-${it.color}`} className="flex gap-4">
              <div className="relative w-16 shrink-0">
                <img src={it.image} alt={it.name} className="w-full aspect-[3/4] object-cover" />
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {it.quantity}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm">{it.name}</p>
                <p className="text-xs text-muted-foreground">{it.color} · {it.size}</p>
              </div>
              <p className="text-sm tabular-nums">€{(it.price * it.quantity).toFixed(2)}</p>
            </li>
          ))}
        </ul>
        <div className="border-t hairline pt-5 space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">€{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span className="tabular-nums">{shipping === 0 ? "Free" : `€${shipping.toFixed(2)}`}</span></div>
          <div className="flex justify-between pt-3 border-t hairline mt-3 text-base">
            <span>Total</span>
            <span className="tabular-nums">€{total.toFixed(2)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground block mb-2">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-foreground bg-transparent py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
