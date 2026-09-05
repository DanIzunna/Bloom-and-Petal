"use client";

import Link from "next/link";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, imageFor, type Product } from "../../../lib/api";
import { useCart } from "../../../lib/store/useCart";
import RemoteImage from "../../../components/RemoteImage";
import { Badge, Button } from "../../../components/ui";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCart((state) => state.addToCart);
  useEffect(() => {
    if (id)
      api
        .product(id)
        .then(setProduct)
        .catch((e) => setError(e.message));
  }, [id]);
  if (error)
    return (
      <main className="mx-auto max-w-7xl px-5 py-24 text-center text-[#b65e6d]">
        {error}
      </main>
    );
  if (!product)
    return (
      <main className="mx-auto max-w-7xl px-5 py-24 text-center font-sans text-3xl text-[#8b8178]">
        Loading bloom...
      </main>
    );
  const add = () => {
    for (let index = 0; index < quantity; index += 1) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-10 lg:py-20">
      <Link
        href="/products"
        className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#68816e]"
      >
        <ArrowLeft size={15} /> Back to collection
      </Link>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="image-radius relative aspect-[0.9] overflow-hidden bg-[#eee6db]">
          <RemoteImage
            src={imageFor(product)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="image-radius h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{product.category.name}</Badge>
            {product.occasion && (
              <Badge tone="neutral">{product.occasion}</Badge>
            )}
          </div>
          <h1 className="mt-4 font-sans text-6xl leading-none text-[var(--foreground)]">
            {product.name}
          </h1>
          <p className="mt-6 text-2xl font-semibold text-[var(--foreground)]">
            ${Number(product.price).toFixed(2)}
          </p>
          <p className="mt-6 max-w-lg text-base leading-8 text-[#8b8178]">
            {product.description}
          </p>
          {product.careInstructions && (
            <div className="mt-8 border-t border-[#e8ded4] pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68756b]">
                Care notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[#8b8178]">
                {product.careInstructions}
              </p>
            </div>
          )}
          <div className="mt-8 flex items-center gap-3">
            <Badge
              tone={
                product.stock < 1
                  ? "destructive"
                  : product.stock <= 5
                    ? "warning"
                    : "success"
              }
            >
              {product.stock < 1
                ? "Out of stock"
                : product.stock <= 5
                  ? `${product.stock} left`
                  : "In stock"}
            </Badge>
            <span className="text-sm text-[var(--muted-foreground)]">
              {product.stock} available
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid size-11 place-items-center text-[var(--primary)] disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= product.stock}
                onClick={() =>
                  setQuantity((value) => Math.min(product.stock, value + 1))
                }
                className="grid size-11 place-items-center text-[var(--primary)] disabled:opacity-30"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button disabled={!product.stock} onClick={add}>
              {added ? (
                <>
                  <Check size={16} /> Added to bag
                </>
              ) : (
                <>
                  <Plus size={16} /> Add to bag
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
