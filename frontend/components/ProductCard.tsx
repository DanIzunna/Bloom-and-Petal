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
  const cartItems = useCart((state) => state.items);
  const [added, setAdded] = useState(false);

  const cartQuantity =
    cartItems.find((item) => item.id === product.id)?.quantity ?? 0;

  const remainingStock = Math.max(product.stock - cartQuantity, 0);

  const isSoldOut = remainingStock < 1;
  const isLowStock = remainingStock >= 1 && remainingStock <= 9;

  const stockLabel = isSoldOut
    ? "Sold out"
    : isLowStock
      ? `${remainingStock} left`
      : "In stock";

  function handleAdd() {
    if (isSoldOut) return;

    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article
      className={`group surface overflow-hidden transition duration-300 ${
        isSoldOut
          ? "opacity-65"
          : "hover:-translate-y-0.5 hover:border-[var(--primary)]"
      }`}
    >
      <Link
        href={`/products/${product.slug}`}
        className="image-radius relative block aspect-[0.88] overflow-hidden bg-[var(--secondary)]"
      >
        <RemoteImage
          src={imageFor(product)}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          className={`image-radius h-full w-full object-cover transition duration-700 motion-reduce:transition-none ${
            isSoldOut ? "grayscale" : "group-hover:scale-105"
          }`}
        />

        {product.occasion && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {product.occasion}
          </span>
        )}

        {isSoldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-[#27332f]/10">
            <span className="bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Sold out
            </span>
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
            className={`mt-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
              isSoldOut
                ? "text-[var(--muted-foreground)]"
                : isLowStock
                  ? "text-[var(--warning)]"
                  : "text-[var(--success)]"
            }`}
          >
            {stockLabel}
          </p>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={isSoldOut}
        aria-label={`Add ${product.name} to cart`}
        className="mx-4 mb-4 mt-4 flex min-h-11 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
      >
        {isSoldOut ? (
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
