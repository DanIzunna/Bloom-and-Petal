"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Order } from "../../lib/api";
import { useAuth } from "../../lib/store/useAuth";
import {
  Badge,
  EmptyState,
  LoadingState,
  PageContainer,
} from "../../components/ui";
import RemoteImage from "../../components/RemoteImage";

const statusTone = {
  PENDING: "warning",
  PROCESSING: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const { token, hydrated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated || !token) return;

    api
      .orders(token)
      .then((result) => setOrders(result.data.items))
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Unable to load your orders.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hydrated, token]);

  if (loading && (!hydrated || Boolean(token))) {
    return <LoadingState label="Loading your orders..." />;
  }

  return (
    <PageContainer className="py-8 sm:py-10 lg:py-12">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Your history</p>

          <h1 className="mt-2 font-sans text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
            My orders
          </h1>
        </div>

        {orders.length > 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        )}
      </header>

      {error || (!token && hydrated) ? (
        <div className="mx-auto mt-16 max-w-lg text-center">
          <div className="surface px-6 py-12">
            <p className="text-sm text-[var(--destructive)]">
              {error || "Please sign in to view your orders."}
            </p>

            <Link
              href="/auth"
              className="mt-6 inline-flex rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No orders yet"
            detail="Your first bouquet is waiting for a reason to bloom."
            action={
              <Link
                href="/products"
                className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
              >
                Browse the collection
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {orders.map((order) => {
            const visibleItems = order.orderItems.slice(0, 3);
            const remainingItems = order.orderItems.length - 3;

            return (
              <Link
                href={`/orders/${order.id}`}
                key={order.id}
                className="group block rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-lift)] sm:p-5"
              >
                {/* Top row */}
                <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                        Order
                      </p>

                      <span className="font-mono text-[10px] text-[var(--foreground)]">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>

                    <h2 className="mt-2 font-sans text-xl text-[var(--foreground)] sm:text-2xl">
                      {order.recipientName}
                    </h2>

                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Placed {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <Badge tone={statusTone[order.status]}>
                      {order.status}
                    </Badge>

                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Products */}
                <div className="py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 -space-x-2">
                      {visibleItems.map((item) => (
                        <div
                          key={item.id}
                          className="image-radius relative size-12 overflow-hidden border-2 border-white bg-[var(--secondary)] sm:size-14"
                        >
                          <RemoteImage
                            src={
                              item.product.imageUrl ||
                              item.product.images[0] ||
                              "/file.svg"
                            }
                            alt={item.product.name}
                            fill
                            sizes="56px"
                            className="image-radius object-cover"
                          />
                        </div>
                      ))}

                      {remainingItems > 0 && (
                        <div className="grid size-12 place-items-center rounded-full border-2 border-white bg-[var(--secondary)] text-[10px] font-bold text-[var(--muted-foreground)] sm:size-14">
                          +{remainingItems}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {order.orderItems.length}{" "}
                        {order.orderItems.length === 1 ? "item" : "items"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                        {order.orderItems
                          .map((item) => item.product.name)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom metadata */}
                <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      Delivery {formatDate(order.deliveryDate)}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Package size={14} />
                      {order.status === "DELIVERED"
                        ? "Delivered"
                        : "Delivery scheduled"}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[var(--primary)]">
                    View order
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
