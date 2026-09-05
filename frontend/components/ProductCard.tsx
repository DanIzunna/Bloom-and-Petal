"use client";

import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "../lib/api";
import { imageFor } from "../lib/api";
import { useCart } from "../lib/store/useCart";
import RemoteImage from "./RemoteImage";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useCart((state) => state.addToCart);
  const [added, setAdded] = useState(false);
  const stockLabel =
    product.stock < 1
      ? "Sold out"
      : product.stock <= 5
        ? `${product.stock} left`
        : "In stock";
  function handleAdd() {
    if (product.stock > 0) addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }
  return (
    <article className="group surface overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]">
      <Link
        href={`/products/${product.slug}`}
        className="image-radius relative block aspect-[0.88] overflow-hidden bg-[var(--secondary)]"
      >
        <RemoteImage
          src={imageFor(product)}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="image-radius h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transition-none"
        />
        {product.occasion && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {product.occasion}
          </span>
        )}
      </Link>
      <div className="flex min-h-[104px] items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h3
            title={product.name}
            className="line-clamp-2 min-h-[2.75rem] font-sans text-sm font-semibold leading-5 text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)] sm:text-base"
          >
            {product.name}
          </h3>
          {product.category?.name && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {product.category.name}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="pt-1 text-sm font-semibold text-[var(--primary)]">
            ${Number(product.price).toFixed(2)}
          </p>
          <p
            className={`mt-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${product.stock < 1 ? "text-[var(--destructive)]" : product.stock <= 5 ? "text-[var(--warning)]" : "text-[var(--success)]"}`}
          >
            {stockLabel}
          </p>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={product.stock < 1}
        aria-label={`Add ${product.name} to cart`}
        className="mx-4 mb-4 mt-4 flex min-h-11 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
      >
        {product.stock < 1 ? (
          "Sold out"
        ) : added ? (
          <>
            <Check size={15} /> Added
          </>
        ) : (
          <>
            <Plus size={15} /> Add to cart
          </>
        )}
      </button>
    </article>
  );
}
