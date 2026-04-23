import { Link } from "@tanstack/react-router";
import { X, Minus, Plus } from "lucide-react";
import { useEffect } from "react";
import { useCart, updateQuantity, removeFromCart } from "@/lib/cart";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal } = useCart();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-foreground/30 transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-background flex flex-col transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b hairline">
          <span className="eyebrow">Shopping bag ({items.length})</span>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
              <p className="font-display text-2xl mb-3">Your bag is empty</p>
              <p className="text-sm text-muted-foreground mb-8">
                Discover our latest collection.
              </p>
              <button onClick={onClose} className="eyebrow link-underline">
                Continue shopping
              </button>
            </div>
          ) : (
            <ul>
              {items.map((it) => (
                <li
                  key={`${it.productId}-${it.size}-${it.color}`}
                  className="flex gap-4 p-6 border-b hairline"
                >
                  <Link
                    to="/product/$slug"
                    params={{ slug: it.slug }}
                    onClick={onClose}
                    className="block w-24 shrink-0 bg-secondary"
                  >
                    <img src={it.image} alt={it.name} className="w-full aspect-[3/4] object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-3">
                      <Link
                        to="/product/$slug"
                        params={{ slug: it.slug }}
                        onClick={onClose}
                        className="text-sm hover:underline"
                      >
                        {it.name}
                      </Link>
                      <span className="text-sm tabular-nums">
                        €{(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {it.color} · {it.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border hairline">
                        <button
                          className="px-2 py-1"
                          onClick={() =>
                            updateQuantity(it.productId, it.size, it.color, it.quantity - 1)
                          }
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                        <span className="px-3 text-xs tabular-nums">{it.quantity}</span>
                        <button
                          className="px-2 py-1"
                          onClick={() =>
                            updateQuantity(it.productId, it.size, it.color, it.quantity + 1)
                          }
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(it.productId, it.size, it.color)}
                        className="eyebrow text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t hairline p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">€{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full bg-foreground text-background text-center py-4 eyebrow hover:bg-foreground/90 transition"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
