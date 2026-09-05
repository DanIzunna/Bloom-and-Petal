"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Order } from "../../../../lib/api";
import { useAuth } from "../../../../lib/store/useAuth";
import RemoteImage from "../../../../components/RemoteImage";
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  PageContainer,
  Select,
} from "../../../../components/ui";

const tone = {
  PENDING: "warning",
  PROCESSING: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
} as const;
const transitions: Record<Order["status"], Order["status"][]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};
export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuth((state) => state.token);
  const [order, setOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<Order["status"] | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (token && id)
      api
        .order(id, token)
        .then((result) => setOrder(result.data))
        .catch((e) => setError(e.message));
  }, [token, id]);
  async function updateStatus() {
    if (!token || !order || !nextStatus) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.updateOrderStatus(order.id, nextStatus, token);
      setOrder(result.data);
      setNextStatus("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update order status.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (error && !order)
    return (
      <PageContainer>
        <ErrorState message={error} />
      </PageContainer>
    );
  if (!order) return <LoadingState label="Loading order..." />;
  return (
    <PageContainer>
      <Link
        href="/admin-portal/orders"
        className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
      >
        ← Back to orders
      </Link>
      <div className="mt-8 flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-8">
        <div>
          <p className="section-label">Fulfillment</p>
          <h1 className="mt-2 font-sans text-5xl text-[var(--foreground)]">
            Order detail.
          </h1>
          <p className="mt-3 font-mono text-xs text-[var(--muted-foreground)]">
            {order.id}
          </p>
        </div>
        <div className="text-right">
          <Badge tone={tone[order.status]}>{order.status}</Badge>
          <p className="mt-3 font-sans text-3xl">${order.totalAmount}</p>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <section className="space-y-4">
          {order.orderItems.map((item) => (
            <div key={item.id} className="surface flex items-center gap-4 p-4">
              <RemoteImage
                src={item.product.images[0]}
                alt={item.product.name}
                width={80}
                height={80}
                className="size-20 rounded-[var(--radius-sm)] object-cover"
              />
              <div className="flex-1">
                <h2 className="font-sans text-2xl">{item.product.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {item.quantity} × ${item.price}
                </p>
              </div>
              <p className="font-semibold">
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </section>
        <aside className="surface h-fit p-6">
          <h2 className="font-sans text-2xl">Fulfillment details</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Recipient
              </dt>
              <dd className="mt-1">{order.recipientName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Address
              </dt>
              <dd className="mt-1 leading-6">{order.deliveryAddress}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Delivery
              </dt>
              <dd className="mt-1">
                {new Date(order.deliveryDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Created
              </dt>
              <dd className="mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
          <div className="mt-7 border-t border-[var(--border)] pt-5">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Update status
              <Select
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as Order["status"])
                }
                className="mt-2"
              >
                <option value="">Choose next status</option>
                {transitions[order.status].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              disabled={!nextStatus || busy}
              onClick={updateStatus}
              className="mt-4 w-full"
            >
              {busy ? "Updating..." : "Update status"}
            </Button>
            {error && (
              <p className="mt-4 text-sm text-[var(--destructive)]">{error}</p>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
