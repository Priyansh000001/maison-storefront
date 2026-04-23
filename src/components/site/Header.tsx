import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "./CartDrawer";

const NAV = [
  { to: "/woman", label: "Woman" },
  { to: "/man", label: "Man" },
  { to: "/accessories", label: "Accessories" },
  { to: "/shoes", label: "Shoes" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();
  const { location } = useRouterState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b hairline"
            : "bg-background/0 border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-5 md:h-20 md:px-10">
          <button
            className="md:hidden -ml-2 p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.25} />
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="eyebrow link-underline text-foreground/80 hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <span className="font-display text-2xl md:text-3xl tracking-[0.3em] font-light">
              MAISON
            </span>
          </Link>

          <div className="flex items-center gap-1 md:gap-3">
            <button className="hidden md:inline-flex p-2" aria-label="Search">
              <Search className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <Link to="/account" className="p-2" aria-label="Account">
              <User className="h-5 w-5" strokeWidth={1.25} />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
              {count > 0 && (
                <span className="absolute top-0 right-0 text-[10px] tabular-nums font-medium">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-transform duration-500 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full bg-background flex flex-col">
          <div className="flex items-center justify-between px-5 h-16 border-b hairline">
            <span className="eyebrow">Menu</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close">
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>
          <nav className="flex flex-col p-8 gap-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="font-display text-4xl tracking-tight"
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-border my-4" />
            <Link to="/account" className="eyebrow">Account</Link>
            <Link to="/orders" className="eyebrow">Orders</Link>
          </nav>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
