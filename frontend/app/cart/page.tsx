"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/store/useCart";
import { api, imageFor } from "../../lib/api";
import { useAuth } from "../../lib/store/useAuth";
import RemoteImage from "../../components/RemoteImage";

export default function CartPage() {
  const {
    items,
    deliveryDate,
    setDeliveryDate,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const { token, user, hydrated } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const displaySubtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  async function checkout() {
    setError("");

    if (user?.role === "ADMIN") {
      setError("Admin accounts cannot use customer checkout.");
      return;
    }

    if (!token) {
      router.push("/auth");
      return;
    }

    if (
      !items.length ||
      !recipientName.trim() ||
      !address.trim() ||
      !deliveryDate ||
      new Date(deliveryDate) < new Date(new Date().toDateString())
    ) {
      setError(
        "Add a recipient, delivery address, and a valid future delivery date.",
      );
      return;
    }

    if (items.some((item) => item.quantity > item.stock)) {
      setError("One or more items exceed available stock.");
      return;
    }

    setBusy(true);

    try {
      const result = await api.createOrder(
        {
          recipientName: recipientName.trim(),
          deliveryAddress: address.trim(),
          deliveryDate: new Date(`${deliveryDate}T12:00:00`).toISOString(),
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        },
        token,
      );

      setConfirmation(result.data.id);
      useCart.getState().clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to place your order.");
    } finally {
      setBusy(false);
    }
  }

  if (hydrated && user?.role === "ADMIN") {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center lg:py-28">
        <p className="section-label">Operations account</p>

        <h1 className="mt-3 font-sans text-4xl tracking-[-0.03em] text-[var(--foreground)] sm:text-5xl">
          Customer cart unavailable.
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
          Admin accounts manage the store from the admin area and cannot place
          customer orders.
        </p>

        <Link
          href="/admin-portal"
          className="mt-8 inline-flex rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)]"
        >
          Open admin panel
        </Link>
      </main>
    );
  }

  if (confirmation) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center lg:py-28">
        <p className="section-label">Order confirmed</p>

        <h1 className="mt-3 font-sans text-4xl tracking-[-0.03em] text-[var(--foreground)] sm:text-5xl">
          A little joy is on its way.
        </h1>

        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          Order ID:{" "}
          <span className="font-mono text-xs text-[var(--foreground)]">
            {confirmation}
          </span>
        </p>

        <Link
          href={`/orders/${confirmation}`}
          className="mt-8 inline-flex rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)]"
        >
          View order
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-10 lg:px-10 lg:py-12">
      <header className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-6">
        <div>
          <p className="section-label">Your little garden</p>
          <h1 className="mt-2 font-sans text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
            Shopping bag
          </h1>
        </div>

        {items.length > 0 && (
          <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <div className="surface px-6 py-16 text-center sm:py-20">
          <p className="font-sans text-3xl tracking-[-0.02em] text-[var(--foreground)] sm:text-4xl">
            Your bag is waiting for something beautiful.
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Browse the collection and find something worth bringing home.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)]"
          >
            Browse the blooms
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
          <section>
            <div className="surface overflow-hidden">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className={`flex gap-4 p-4 sm:gap-5 sm:p-5 ${
                    index !== items.length - 1
                      ? "border-b border-[var(--border)]"
                      : ""
                  }`}
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="image-radius relative size-24 shrink-0 overflow-hidden bg-[var(--secondary)] sm:size-28"
                  >
                    <RemoteImage
                      src={imageFor(item)}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="image-radius object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        {item.occasion && (
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                            {item.occasion}
                          </p>
                        )}

                        <Link
                          href={`/products/${item.slug}`}
                          className="mt-1 block font-sans text-lg leading-6 text-[var(--foreground)] transition-colors hover:text-[var(--primary)] sm:text-xl"
                        >
                          {item.name}
                        </Link>

                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          ${Number(item.price).toFixed(2)} each
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
                      >
                        <Trash2 size={16} strokeWidth={1.6} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label={`Decrease ${item.name} quantity`}
                          className="grid size-9 place-items-center text-[var(--muted-foreground)] transition hover:text-[var(--primary)]"
                        >
                          <Minus size={13} />
                        </button>

                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label={`Increase ${item.name} quantity`}
                          className="grid size-9 place-items-center text-[var(--muted-foreground)] transition hover:text-[var(--primary)]"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)] transition hover:text-[var(--accent)]"
            >
              <ArrowLeft size={15} />
              Continue shopping
            </Link>
          </section>

          <aside className="h-fit rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7 lg:sticky lg:top-24">
            <div className="border-b border-[var(--border)] pb-5">
              <p className="section-label">Checkout</p>

              <h2 className="mt-2 font-sans text-2xl text-[var(--foreground)]">
                Delivery details
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Tell us where and when to leave a little joy.
              </p>
            </div>

            <div className="space-y-6 pt-6">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                Recipient name
                <input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Who is receiving the flowers?"
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgb(47_93_80_/_0.12)]"
                />
              </label>

              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                Delivery address
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street, city, postal code"
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgb(47_93_80_/_0.12)]"
                />
              </label>

              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                Delivery date
                <input
                  type="date"
                  value={deliveryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgb(47_93_80_/_0.12)]"
                />
              </label>
            </div>

            <div className="mt-7 space-y-3 border-t border-[var(--border)] pt-5 text-sm">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Subtotal</span>
                <span>${displaySubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Delivery</span>
                <span>$0.00</span>
              </div>

              <div className="flex justify-between border-t border-[var(--border)] pt-4 text-base font-bold text-[var(--foreground)]">
                <span>Total</span>
                <span>${displaySubtotal.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-[var(--radius-sm)] bg-[#fff0f0] px-3 py-3 text-sm leading-5 text-[var(--destructive)]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={checkout}
              disabled={busy}
              className="mt-6 w-full rounded-[var(--radius-sm)] bg-[var(--primary)] py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Placing order..." : "Place order"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
