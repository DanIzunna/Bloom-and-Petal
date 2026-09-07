"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  MapPin,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api, ApiError, type Order } from "../../../lib/api";
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
  const [error, setError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    if (hydrated && token && id) {
      api
        .order(id, token)
        .then((result) => setOrder(result.data))
        .catch((e) => {
          setError(
            e instanceof Error ? e : new Error("Unable to load this order."),
          );
        });
    }
  }, [hydrated, token, id]);

  if (!hydrated) {
    return <LoadingState label="Loading order..." />;
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-5 py-16">
        <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-10 sm:py-16">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--secondary)]">
            <MapPin
              size={24}
              strokeWidth={1.7}
              className="text-[var(--primary)]"
            />
          </div>

          <p className="section-label mt-6">My orders</p>

          <h1 className="mt-2 font-sans text-3xl tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
            Sign in to view your orders
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Please sign in to view your order history and track your deliveries.
          </p>

          <Link
            href="/auth"
            className="mt-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)]"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    const isNotFound = error instanceof ApiError && error.status === 404;

    const isBadRequest = error instanceof ApiError && error.status === 400;

    const isUnauthorized = error instanceof ApiError && error.status === 401;

    let title = "Something went wrong";
    let description = "We couldn't load this order. Please try again.";

    let buttonLabel = "Back to My Orders";
    let buttonHref = "/orders";

    if (isNotFound) {
      title = "Order not found";
      description =
        "We couldn't find an order with that reference. It may have been removed or the link may be incorrect.";
    } else if (isBadRequest) {
      title = "Invalid order link";
      description =
        "This order link doesn't appear to be valid. Please return to your orders and select an order from there.";
    } else if (isUnauthorized) {
      title = "Please sign in";
      description =
        "Your session may have expired. Sign in again to view your orders.";
      buttonLabel = "Sign in";
      buttonHref = "/auth";
    }

    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-5 py-16">
        <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-10 sm:py-16">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--secondary)]">
            {isNotFound || isBadRequest ? (
              <CircleAlert
                size={24}
                strokeWidth={1.7}
                className="text-[var(--primary)]"
              />
            ) : (
              <MapPin
                size={24}
                strokeWidth={1.7}
                className="text-[var(--primary)]"
              />
            )}
          </div>

          <p className="section-label mt-6">My orders</p>

          <h1 className="mt-2 font-sans text-3xl tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            {description}
          </p>

          <Link
            href={buttonHref}
            className="mt-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)]"
          >
            {buttonLabel}
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return <LoadingState label="Loading order..." />;
  }

  const isCancelled = order.status === "CANCELLED";

  const timelineSteps = isCancelled
    ? [
        {
          label: "Order placed",
          description: "Your order has been received.",
          state: "complete" as const,
        },
        {
          label: "Payment confirmed",
          description: "Your payment was successfully confirmed.",
          state: "complete" as const,
        },
        {
          label: "Order cancelled",
          description: "This order has been cancelled.",
          state: "cancelled" as const,
        },
      ]
    : [
        {
          label: "Order placed",
          description: "Your order has been received.",
          state: "complete" as const,
        },
        {
          label: "Payment confirmed",
          description:
            order.status === "PENDING"
              ? "Your payment is being confirmed."
              : "Your payment was successfully confirmed.",
          state:
            order.status === "PENDING"
              ? ("current" as const)
              : ("complete" as const),
        },
        {
          label: "Processing",
          description:
            order.status === "PROCESSING"
              ? "We're preparing your order."
              : order.status === "DELIVERED"
                ? "Your order was prepared for delivery."
                : "We'll begin preparing your order once payment is confirmed.",
          state:
            order.status === "PROCESSING"
              ? ("current" as const)
              : order.status === "DELIVERED"
                ? ("complete" as const)
                : ("upcoming" as const),
        },
        {
          label: "Delivered",
          description:
            order.status === "DELIVERED"
              ? "Your order has been delivered."
              : "Your order will be delivered on the scheduled date.",
          state:
            order.status === "DELIVERED"
              ? ("complete" as const)
              : ("upcoming" as const),
        },
      ];

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

            <p className="mt-3 break-all font-mono text-[10px] text-[var(--muted-foreground)]">
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

      {/* Order tracking */}
      <section className="mt-7 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <div>
          <p className="section-label">Order tracking</p>

          <h2 className="mt-1 font-sans text-2xl text-[var(--foreground)]">
            Your order journey
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Follow your order from confirmation through delivery.
          </p>
        </div>

        <div className="mt-7">
          {timelineSteps.map((step, index) => {
            const isLast = index === timelineSteps.length - 1;

            return (
              <div key={step.label} className="flex gap-4">
                <div className="flex w-7 shrink-0 flex-col items-center">
                  <div
                    className={`flex size-7 items-center justify-center rounded-full border ${
                      step.state === "complete"
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : step.state === "current"
                          ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--primary)]"
                          : step.state === "cancelled"
                            ? "border-[var(--destructive)] bg-[var(--destructive)] text-white"
                            : "border-[var(--border)] bg-white text-[var(--muted-foreground)]"
                    }`}
                  >
                    {step.state === "cancelled" ? (
                      <X size={14} strokeWidth={2.5} />
                    ) : step.state === "complete" ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <span className="size-2 rounded-full bg-current" />
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={`my-1 h-10 w-px ${
                        step.state === "complete"
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--border)]"
                      }`}
                    />
                  )}
                </div>

                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-sans text-base ${
                        step.state === "current"
                          ? "font-semibold text-[var(--primary)]"
                          : step.state === "cancelled"
                            ? "font-semibold text-[var(--destructive)]"
                            : step.state === "upcoming"
                              ? "text-[var(--muted-foreground)]"
                              : "text-[var(--foreground)]"
                      }`}
                    >
                      {step.label}
                    </h3>

                    {step.state === "current" && (
                      <span className="rounded-full bg-[var(--secondary)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
                    src={
                      item.product.imageUrl ||
                      item.product.images[0] ||
                      "/file.svg"
                    }
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
