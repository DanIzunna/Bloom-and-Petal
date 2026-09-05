import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--secondary)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <Link
            href="/"
            className="font-sans text-3xl font-semibold text-[var(--primary)]"
          >
            Bloom <span className="text-[var(--accent)]">&amp;</span> Petal
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">
            Fresh flowers and thoughtful plants for the moments worth
            remembering.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
            Shop
          </h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted-foreground)]">
            <Link
              className="block hover:text-[var(--primary)]"
              href="/products"
            >
              All blooms
            </Link>
            <Link
              className="block hover:text-[var(--primary)]"
              href="/products?category=bouquets"
            >
              Bouquets
            </Link>
            <Link
              className="block hover:text-[var(--primary)]"
              href="/products?category=indoor-plants"
            >
              Indoor plants
            </Link>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
            Customer care
          </h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted-foreground)]">
            <Link className="block hover:text-[var(--primary)]" href="/orders">
              My orders
            </Link>
            <Link className="block hover:text-[var(--primary)]" href="/auth">
              Login or register
            </Link>
            <Link className="block hover:text-[var(--primary)]" href="/cart">
              Shopping bag
            </Link>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
            A note from us
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
            Seasonal availability changes often. Every stem is selected with
            care.
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-5 py-5 text-center text-xs text-[var(--muted-foreground)] lg:px-10">
        © {new Date().getFullYear()} Bloom &amp; Petal. Made for slow moments.
      </div>
    </footer>
  );
}
