"use client";

import Link from "next/link";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, imageFor, type Product } from "../../../lib/api";
import { useCart } from "../../../lib/store/useCart";
import RemoteImage from "../../../components/RemoteImage";
import { Badge, Button } from "../../../components/ui";
import NotFoundContent from "../../../components/NotFoundContent";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const addToCart = useCart((state) => state.addToCart);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeFromCart = useCart((state) => state.removeFromCart);
  const cartItems = useCart((state) => state.items);

  useEffect(() => {
    if (id) {
      api
        .product(id)
        .then(setProduct)
        .catch((e) => setError(e.message));
    }
  }, [id]);

  if (error) return <NotFoundContent />;

  if (!product)
    return (
      <main className="mx-auto max-w-7xl px-5 py-24 text-center font-sans text-3xl text-[#8b8178]">
        Loading bloom...
      </main>
    );

  const cartQuantity =
    cartItems.find((item) => item.id === product.id)?.quantity ?? 0;

  const remainingStock = Math.max(product.stock - cartQuantity, 0);
  const isSoldOut = remainingStock < 1;
  const isLowStock = remainingStock >= 1 && remainingStock <= 9;

  const add = () => {
    if (remainingStock < quantity) return;

    for (let index = 0; index < quantity; index += 1) {
      addToCart(product);
    }

    setQuantity(1);
    setAdded(true);

    window.setTimeout(() => setAdded(false), 1400);
  };

  const decreaseBagQuantity = () => {
    if (cartQuantity <= 0) return;

    if (cartQuantity === 1) {
      removeFromCart(product.id);
      return;
    }

    updateQuantity(product.id, cartQuantity - 1);
  };

  const increaseBagQuantity = () => {
    if (remainingStock <= 0) return;

    updateQuantity(product.id, cartQuantity + 1);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-14 pt-6 sm:pb-16 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-9">
      <Link
        href="/products"
        className="group mb-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#68816e] transition-colors hover:text-[#b65e6d] sm:mb-8"
      >
        <ArrowLeft
          size={14}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Back to collection
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)] lg:gap-12 xl:gap-20">
        {/* Product image */}
        <div className="relative">
          <div
            className={`image-radius relative aspect-[1.15] overflow-hidden bg-[#eee6db] sm:aspect-[1.2] lg:aspect-[1.18] ${
              isSoldOut ? "opacity-65" : ""
            }`}
          >
            <RemoteImage
              src={imageFor(product)}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 55vw, 100vw"
              className={`image-radius h-full w-full object-cover ${
                isSoldOut ? "grayscale" : ""
              }`}
            />

            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#27332f]/10">
                <span className="bg-white/90 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f7773]">
                  Sold out
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#aaa198]">
            <span>Bloom &amp; Petal</span>
            <span>Floral collection</span>
          </div>
        </div>

        {/* Product information */}
        <div className="flex flex-col lg:pt-1 xl:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{product.category.name}</Badge>

            {product.occasion && (
              <Badge tone="neutral">{product.occasion}</Badge>
            )}
          </div>

          <h1 className="mt-4 max-w-xl font-sans text-[2.35rem] leading-[1.04] tracking-[-0.035em] text-[#27332f] sm:text-4xl xl:text-[3.15rem]">
            {product.name}
          </h1>

          <p className="mt-4 text-xl font-semibold tracking-[-0.01em] text-[#2f5d50]">
            ${Number(product.price).toFixed(2)}
          </p>

          <div className="mt-6 border-t border-[#e8ded4] pt-6">
            <p className="max-w-xl text-[14px] leading-7 text-[#81786f]">
              {product.description}
            </p>
          </div>

          {product.careInstructions && (
            <div className="mt-6 border-t border-[#e8ded4] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#68756b]">
                Care notes
              </p>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#8b8178]">
                {product.careInstructions}
              </p>
            </div>
          )}

          {/* Availability & purchase */}
          <div className="mt-7 border-t border-[#e8ded4] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge
                  tone={
                    isSoldOut ? "neutral" : isLowStock ? "warning" : "success"
                  }
                >
                  {isSoldOut
                    ? "Sold out"
                    : isLowStock
                      ? `${remainingStock} left`
                      : "In stock"}
                </Badge>

                {!isSoldOut && (
                  <span className="text-xs text-[#8f867d]">
                    <span className="font-semibold text-[#5f7166]">
                      {remainingStock}
                    </span>{" "}
                    available
                  </span>
                )}
              </div>

              {cartQuantity > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9188]">
                  {cartQuantity} in your bag
                </span>
              )}
            </div>

            {cartQuantity > 0 ? (
              <div className="mt-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="inline-flex min-h-12 w-fit shrink-0 items-center border border-[#ddd6ce] bg-white">
                    <button
                      type="button"
                      aria-label="Decrease quantity in bag"
                      onClick={decreaseBagQuantity}
                      className="grid size-12 place-items-center text-[#2f5d50] transition-colors hover:bg-[#f1ece5]"
                    >
                      <Minus size={15} strokeWidth={1.8} />
                    </button>

                    <span className="w-10 text-center text-sm font-semibold text-[#27332f]">
                      {cartQuantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase quantity in bag"
                      disabled={remainingStock <= 0}
                      onClick={increaseBagQuantity}
                      className="grid size-12 place-items-center text-[#2f5d50] transition-colors hover:bg-[#f1ece5] disabled:opacity-25"
                    >
                      <Plus size={15} strokeWidth={1.8} />
                    </button>
                  </div>

                  <Link
                    href="/cart"
                    className="inline-flex min-h-12 items-center justify-center border border-[#e8ded4] bg-white px-6 text-xs font-bold uppercase tracking-[0.16em] text-[#273d32] transition-colors hover:border-[#b65e6d] hover:bg-[#f3e8e3]"
                  >
                    View bag
                  </Link>
                </div>

                <p className="mt-3 text-xs text-[#9a9188]">
                  {remainingStock > 0
                    ? `${remainingStock} more available to add`
                    : "No more available"}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="inline-flex min-h-12 w-fit shrink-0 items-center border border-[#ddd6ce] bg-white">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || isSoldOut}
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="grid size-12 place-items-center text-[#2f5d50] transition-colors hover:bg-[#f1ece5] disabled:opacity-25"
                  >
                    <Minus size={15} strokeWidth={1.8} />
                  </button>

                  <span className="w-9 text-center text-sm font-semibold text-[#27332f]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={isSoldOut || quantity >= remainingStock}
                    onClick={() =>
                      setQuantity((value) =>
                        Math.min(remainingStock, value + 1),
                      )
                    }
                    className="grid size-12 place-items-center text-[#2f5d50] transition-colors hover:bg-[#f1ece5] disabled:opacity-25"
                  >
                    <Plus size={15} strokeWidth={1.8} />
                  </button>
                </div>

                <Button disabled={isSoldOut} onClick={add}>
                  {isSoldOut ? (
                    "Sold out"
                  ) : added ? (
                    <>
                      <Check size={16} />
                      Added to bag
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add to bag
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#aaa198]">
            <span className="h-px w-7 bg-[#e8ded4]" />
            <span>Made for meaningful moments</span>
          </div>
        </div>
      </div>
    </main>
  );
}
