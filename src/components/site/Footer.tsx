import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t hairline mt-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <h4 className="eyebrow mb-5">Help</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a className="link-underline" href="#">Contact us</a></li>
              <li><a className="link-underline" href="#">Shipping</a></li>
              <li><a className="link-underline" href="#">Returns</a></li>
              <li><a className="link-underline" href="#">Size guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow mb-5">Maison</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a className="link-underline" href="#">Our story</a></li>
              <li><a className="link-underline" href="#">Sustainability</a></li>
              <li><a className="link-underline" href="#">Careers</a></li>
              <li><a className="link-underline" href="#">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow mb-5">Shop</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/woman" className="link-underline">Woman</Link></li>
              <li><Link to="/man" className="link-underline">Man</Link></li>
              <li><Link to="/accessories" className="link-underline">Accessories</Link></li>
              <li><Link to="/shoes" className="link-underline">Shoes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow mb-5">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Receive our latest editorials and collection drops.
            </p>
            <form className="flex border-b border-foreground" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="eyebrow">Join</button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 border-t hairline">
          <div className="font-display text-2xl tracking-[0.3em]">MAISON</div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Maison. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
