"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Order } from "../../../lib/api";
import { useAuth } from "../../../lib/store/useAuth";
import RemoteImage from "../../../components/RemoteImage";
import { Badge, LoadingState } from "../../../components/ui";

const statusTone = {
  PENDING: "warning",
  PROCESSING: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, hydrated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && token && id) {
      api
        .order(id, token)
        .then((result) => setOrder(result.data))
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : "Unable to load this order.",
          ),
        );
    }
  }, [hydrated, token, id]);

  if (!hydrated) {
    return <LoadingState label="Loading order..." />;
  }

  if (error || (hydrated && !token)) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center lg:py-28">
        <div className="surface px-6 py-12">
          <p className="text-sm text-[var(--destructive)]">
            {error || "Please sign in to view this order."}
          </p>

          <Link
            href="/auth"
            className="mt-6 inline-flex rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)]"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return <LoadingState label="Loading order..." />;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-10 lg:px-10 lg:py-12">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)] transition hover:text-[var(--accent)]"
      >
        <ArrowLeft size={15} />
        My orders
      </Link>

      <header className="mt-7 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-label">Order details</p>

            <h1 className="mt-2 font-sans text-3xl tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
              {order.recipientName}
            </h1>

            <p className="mt-3 font-mono text-[10px] break-all text-[var(--muted-foreground)]">
              {order.id}
            </p>
          </div>

          <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
            <Badge tone={statusTone[order.status]}>{order.status}</Badge>

            <p className="font-sans text-2xl text-[var(--foreground)]">
              ${Number(order.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays
              size={17}
              className="mt-0.5 shrink-0 text-[var(--accent)]"
            />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Order date
              </p>

              <p className="mt-1 text-sm text-[var(--foreground)]">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-[var(--accent)]"
            />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Delivery date
              </p>

              <p className="mt-1 text-sm text-[var(--foreground)]">
                {formatDate(order.deliveryDate)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
          <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Items
            </p>

            <h2 className="mt-1 font-sans text-2xl text-[var(--foreground)]">
              What you ordered
            </h2>
          </div>

          <div>
            {order.orderItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex gap-4 p-5 sm:px-6 ${
                  index !== order.orderItems.length - 1
                    ? "border-b border-[var(--border)]"
                    : ""
                }`}
              >
                <div className="image-radius relative size-20 shrink-0 overflow-hidden bg-[var(--secondary)] sm:size-24">
                  <RemoteImage
                    src={item.product.images[0] || "/file.svg"}
                    alt={item.product.name}
                    fill
                    sizes="96px"
                    className="image-radius object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-sans text-lg text-[var(--foreground)]">
                        {item.product.name}
                      </h3>

                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {item.quantity} × ${Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[#f3e8e3] p-6">
            <p className="section-label">Delivery</p>

            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Address
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                {order.deliveryAddress}
              </p>
            </div>

            <div className="mt-5 border-t border-[#ddcbc3] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Delivery date
              </p>

              <p className="mt-2 text-sm text-[var(--foreground)]">
                {formatDate(order.deliveryDate)}
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
              <span>Subtotal</span>
              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>

            <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-base font-bold text-[var(--foreground)]">
              <span>Total</span>
              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
