"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/store/useAuth";
import { useCart } from "@/lib/store/useCart";

type PageState = "loading" | "confirmed" | "failed" | "missing" | "timeout";

export default function CheckoutSuccessPage() {
  const token = useAuth((state) => state.token);
  const authHydrated = useAuth((state) => state.hydrated);
  const clearCart = useCart((state) => state.clearCart);

  const [state, setState] = useState<PageState>("loading");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!authHydrated) return;

    const paymentId = new URLSearchParams(window.location.search).get(
      "payment_id",
    );

    if (!paymentId) {
      setState("missing");
      return;
    }

    if (!token) {
      setState("missing");
      return;
    }

    let cancelled = false;

    const checkPayment = async () => {
      try {
        const result = await api.getPaymentStatus(paymentId, token);

        if (cancelled) return;

        const payment = result.data;

        if (payment.status === "PAID" && payment.orderId) {
          setOrderId(payment.orderId);
          clearCart();
          setState("confirmed");
          return;
        }

        if (payment.status === "FAILED" || payment.status === "EXPIRED") {
          setState("failed");
          return;
        }

        if (attempt >= 12) {
          setState("timeout");
          return;
        }

        setTimeout(() => {
          if (!cancelled) {
            setAttempt((current) => current + 1);
          }
        }, 2000);
      } catch {
        if (!cancelled) {
          setState("failed");
        }
      }
    };

    void checkPayment();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, token, attempt, clearCart]);

  if (state === "loading") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-3xl items-center justify-center px-5 py-16">
        <section className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)]">
            <Loader2
              className="size-5 animate-spin text-[var(--primary)]"
              aria-hidden="true"
            />
          </div>

          <p className="section-label mt-6">Processing payment</p>

          <h1 className="mx-auto mt-3 max-w-xl font-sans text-3xl leading-[1.08] tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
            Just confirming your order.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Your payment was received by Stripe. We&apos;re waiting for Bloom
            &amp; Petal to finish creating your order.
          </p>

          <div className="mx-auto mt-7 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            <span className="size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            This usually takes just a moment
          </div>
        </section>
      </main>
    );
  }

  if (state === "confirmed" && orderId) {
    const orderReference = orderId.slice(0, 8).toUpperCase();

    return (
      <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-4xl items-center px-5 py-12 sm:py-16">
        <section className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--secondary)]">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)] text-white"
            >
              <Check className="size-5" strokeWidth={2.5} />
            </span>
          </div>

          <p className="section-label mt-6">Payment successful</p>

          <h1 className="mx-auto mt-3 max-w-xl font-sans text-4xl leading-[1.08] tracking-[-0.035em] text-[var(--foreground)] sm:text-5xl">
            A little joy is on its way.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Thank you for your order. Your payment has been confirmed and
            we&apos;ve received everything we need.
          </p>

          <div className="mx-auto mt-7 flex max-w-sm items-center justify-center gap-3 border-y border-[var(--border)] py-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Order reference
            </span>

            <span className="font-mono text-xs font-semibold tracking-[0.08em] text-[var(--foreground)]">
              #{orderReference}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)]"
            >
              View order
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <Link
              href="/products"
              className="inline-flex min-w-40 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
            >
              Continue shopping
            </Link>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto mt-9 flex items-center justify-center gap-3"
          >
            <span className="h-px w-10 bg-[var(--border)]" />
            <span className="text-sm text-[var(--accent)]">✦</span>
            <span className="h-px w-10 bg-[var(--border)]" />
          </div>
        </section>
      </main>
    );
  }

  if (state === "timeout") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-3xl items-center justify-center px-5 py-16">
        <section className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--secondary)]">
            <Loader2
              className="size-5 text-[var(--primary)]"
              aria-hidden="true"
            />
          </div>

          <p className="section-label mt-6">Still processing</p>

          <h1 className="mx-auto mt-3 max-w-xl font-sans text-3xl leading-[1.08] tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
            Your payment went through, but we&apos;re still confirming the
            order.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            Please check your orders shortly. Your payment has not been charged
            again.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="inline-flex min-w-40 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)]"
            >
              Check my orders
            </Link>

            <Link
              href="/"
              className="inline-flex min-w-40 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-3xl items-center justify-center px-5 py-16">
      <section className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--primary)]">
          <span className="text-xl" aria-hidden="true">
            ✦
          </span>
        </div>

        <p className="section-label mt-6">Checkout status</p>

        <h1 className="mx-auto mt-3 max-w-xl font-sans text-3xl leading-[1.08] tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          We couldn&apos;t confirm this checkout.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          Your order has not been confirmed. Please return to your cart and try
          again if necessary.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/cart"
            className="inline-flex min-w-40 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--primary-dark)]"
          >
            Return to cart
          </Link>

          <Link
            href="/"
            className="inline-flex min-w-40 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
