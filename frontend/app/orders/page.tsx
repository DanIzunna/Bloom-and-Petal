"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Order } from "../../lib/api";
import { useAuth } from "../../lib/store/useAuth";
import {
  Badge,
  EmptyState,
  LoadingState,
  PageContainer,
} from "../../components/ui";

const statusTone = {
  PENDING: "warning",
  PROCESSING: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
} as const;

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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [hydrated, token]);
  if (loading && (!hydrated || Boolean(token)))
    return <LoadingState label="Loading your orders..." />;
  return (
    <PageContainer className="py-12 lg:py-16">
      <p className="section-label">Your history</p>
      <h1 className="mt-2 font-sans text-6xl text-[var(--foreground)]">
        My orders.
      </h1>
      {error || (!token && hydrated) ? (
        <div className="mt-16 text-center text-[var(--destructive)]">
          {error || "Please sign in to view your orders."}
          <Link
            href="/auth"
            className="mt-6 block text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
          >
            Sign in
          </Link>
        </div>
      ) : orders.length === 0 ? (
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
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <Link
              href={`/orders/${order.id}`}
              key={order.id}
              className="surface block p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-[var(--muted-foreground)]">
                    {order.id}
                  </p>
                  <h2 className="mt-2 font-sans text-2xl text-[var(--foreground)]">
                    {order.recipientName}
                  </h2>
                </div>
                <div className="text-right">
                  <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                  <p className="mt-2 font-semibold text-[var(--foreground)]">
                    ${order.totalAmount}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-[var(--muted-foreground)]">
                Delivery {new Date(order.deliveryDate).toLocaleDateString()} ·{" "}
                {order.orderItems.length} item(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
