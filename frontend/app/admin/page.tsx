"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Order, type Product } from "../../lib/api";
import { useAuth } from "../../lib/store/useAuth";
import {
  Badge,
  ErrorState,
  LoadingState,
  PageContainer,
} from "../../components/ui";

const tone = {
  PENDING: "warning",
  PROCESSING: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
} as const;
const statuses = ["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"] as const;

export default function AdminDashboard() {
  const { token, hydrated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hydrated || !token) return;
    Promise.allSettled([
      api.products("limit=100&sortBy=name&sortOrder=asc"),
      api.adminOrders(token, "limit=100&sortBy=createdAt&sortOrder=desc"),
    ])
      .then(([productResult, orderResult]) => {
        if (productResult.status === "rejected") {
          setError(
            `Unable to load products: ${productResult.reason?.message || "request failed"}`,
          );
        } else {
          setProducts(productResult.value.items);
        }
        if (orderResult.status === "rejected") {
          setError((current) =>
            current
              ? `${current} Unable to load orders: ${orderResult.reason?.message || "request failed"}`
              : `Unable to load orders: ${orderResult.reason?.message || "request failed"}`,
          );
        } else {
          setOrders(orderResult.value.data.items);
        }
      })
      .finally(() => setLoading(false));
  }, [hydrated, token]);
  if (loading) return <LoadingState label="Loading store overview..." />;
  if (error)
    return (
      <PageContainer>
        <ErrorState message={error} />
      </PageContainer>
    );
  const pending = orders.filter((order) => order.status === "PENDING").length;
  const processing = orders.filter(
    (order) => order.status === "PROCESSING",
  ).length;
  const statusRows = statuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="section-label">Store overview</p>
          <h1 className="mt-2 font-sans text-5xl text-[var(--foreground)]">
            Good morning, store team.
          </h1>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          A clear view of today&apos;s work.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Package} label="Total products" value={products.length} />
        <Stat icon={ShoppingBag} label="Total orders" value={orders.length} />
        <Stat
          icon={ClipboardList}
          label="Needs attention"
          value={pending + processing}
          detail={`${pending} pending · ${processing} processing`}
        />
        <Stat
          icon={Package}
          label="Low stock"
          value={products.filter((product) => product.stock <= 5).length}
          detail="5 or fewer remaining"
        />
      </div>
      <section className="surface mt-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-label">Live order mix</p>
            <h2 className="mt-1 font-sans text-3xl text-[var(--foreground)]">
              Order status distribution
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Based on loaded admin orders
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {statusRows.map(({ status, count }) => (
            <div key={status}>
              <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest">
                <span>{status}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--muted)]">
                <div
                  className={`h-2 rounded-full ${status === "PENDING" ? "bg-[var(--warning)]" : status === "PROCESSING" ? "bg-[var(--info)]" : status === "DELIVERED" ? "bg-[var(--success)]" : "bg-[var(--destructive)]"}`}
                  style={{
                    width: `${orders.length ? Math.max((count / orders.length) * 100, count ? 8 : 0) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-10 grid gap-8 xl:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-3xl text-[var(--foreground)]">
              Recent orders
            </h2>
            <Link
              href="/admin-portal/orders"
              className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
            >
              View all <ArrowRight className="inline" size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/admin-portal/orders/${order.id}`}
                className="surface flex flex-wrap items-center justify-between gap-4 p-4 transition hover:shadow-[var(--shadow-lift)]"
              >
                <div>
                  <p className="font-mono text-xs text-[var(--muted-foreground)]">
                    {order.id}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--foreground)]">
                    {order.recipientName}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={tone[order.status]}>{order.status}</Badge>
                  <p className="mt-1 text-sm font-semibold">
                    ${order.totalAmount}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-3xl text-[var(--foreground)]">
              Low stock
            </h2>
            <Link
              href="/admin-portal/products"
              className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
            >
              Manage
            </Link>
          </div>
          <div className="surface divide-y divide-[var(--border)]">
            {products
              .filter((product) => product.stock <= 5)
              .slice(0, 6)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {product.category.name}
                    </p>
                  </div>
                  <Badge tone={product.stock === 0 ? "destructive" : "warning"}>
                    {product.stock === 0
                      ? "Out of stock"
                      : `${product.stock} left`}
                  </Badge>
                </div>
              ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Package;
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="surface p-5">
      <Icon size={19} className="text-[var(--primary)]" />
      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-sans text-4xl text-[var(--foreground)]">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p>
      )}
    </div>
  );
}
