"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../../lib/store/useCart";
import { api, imageFor } from "../../lib/api";
import { useAuth } from "../../lib/store/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  if (hydrated && user?.role === "ADMIN")
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b65e6d]">
          Operations account
        </p>
        <h1 className="mt-3 font-sans text-5xl text-[#273d32]">
          Customer cart unavailable.
        </h1>
        <p className="mt-5 text-[#8b8178]">
          Admin accounts manage the store from the admin area and cannot place
          customer orders.
        </p>
        <Link
          href="/admin-portal"
          className="mt-8 inline-flex bg-[#273d32] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white"
        >
          Open admin panel
        </Link>
      </main>
    );
  if (confirmation)
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b65e6d]">
          Order confirmed
        </p>
        <h1 className="mt-3 font-sans text-6xl text-[#273d32]">
          A little joy is on its way.
        </h1>
        <p className="mt-6 text-[#8b8178]">
          Order ID: <span className="font-mono text-xs">{confirmation}</span>
        </p>
        <Link
          href={`/orders/${confirmation}`}
          className="mt-8 inline-flex bg-[#273d32] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white"
        >
          View order
        </Link>
      </main>
    );
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
      <div className="mb-12 border-b border-[#e8ded4] pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b65e6d]">
          Your little garden
        </p>
        <h1 className="mt-2 font-sans text-6xl tracking-[-0.04em] text-[#273d32]">
          Shopping bag.
        </h1>
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-4xl text-[#273d32]">
            Your bag is waiting for something beautiful.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex bg-[#273d32] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#b65e6d]"
          >
            Browse the blooms
          </Link>
        </div>
      ) : (
        <div className="grid gap-14 lg:grid-cols-[1fr_380px]">
          <section>
            <div className="space-y-7">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 border-b border-[#e8ded4] pb-7 sm:gap-6"
                >
                  <RemoteImage
                    src={imageFor(item)}
                    alt={item.name}
                    width={144}
                    height={144}
                    className="image-radius size-28 object-cover sm:size-36"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b65e6d]">
                          {item.occasion}
                        </p>
                        <h2 className="mt-1 font-sans text-2xl text-[#273d32]">
                          {item.name}
                        </h2>
                        <p className="mt-1 text-sm text-[#8b8178]">
                          ${Number(item.price).toFixed(2)} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-[#a49b92] hover:text-[#b65e6d]"
                      >
                        <Trash2 size={17} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="grid size-7 place-items-center border border-[#ded5cb] text-[#68756b] hover:border-[#d87683]"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="grid size-7 place-items-center border border-[#ded5cb] text-[#68756b] hover:border-[#d87683]"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#68816e]"
            >
              <ArrowLeft size={15} /> Continue shopping
            </Link>
          </section>
          <aside className="h-fit bg-[#f3e8e3] p-7 sm:p-9">
            <h2 className="font-sans text-3xl text-[#273d32]">
              Delivery details
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#8b8178]">
              Tell us where and when to leave a little joy.
            </p>
            <label className="mt-7 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#68756b]">
              Recipient name
              <input
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Who is receiving the flowers?"
                className="mt-2 w-full border-b border-[#cfc0b5] bg-transparent px-0 py-3 text-sm text-[#273d32] outline-none placeholder:text-[#a49b92] focus:border-[#d87683]"
              />
            </label>
            <label className="mt-7 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#68756b]">
              Delivery address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street, city, postal code"
                className="mt-2 w-full border-b border-[#cfc0b5] bg-transparent px-0 py-3 text-sm text-[#273d32] outline-none placeholder:text-[#a49b92] focus:border-[#d87683]"
              />
            </label>
            <label className="mt-6 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#68756b]">
              Delivery date
              <input
                type="date"
                value={deliveryDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setDeliveryDate(event.target.value)}
                className="mt-2 w-full border-b border-[#cfc0b5] bg-transparent px-0 py-3 text-sm text-[#273d32] outline-none focus:border-[#d87683]"
              />
            </label>
            <div className="mt-9 space-y-3 border-t border-[#ddcbc3] pt-5 text-sm">
              <div className="flex justify-between text-[#8b8178]">
                <span>Backend subtotal</span>
                <span>${displaySubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#ddcbc3] pt-4 text-base font-bold text-[#273d32]">
                <span>Total</span>
                <span>${displaySubtotal.toFixed(2)}</span>
              </div>
            </div>
            {error && <p className="mt-5 text-sm text-[#b65e6d]">{error}</p>}
            <button
              onClick={checkout}
              disabled={busy}
              className="mt-7 w-full bg-[#273d32] py-4 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#b65e6d] disabled:opacity-50"
            >
              {busy ? "Placing order..." : "Place order"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
