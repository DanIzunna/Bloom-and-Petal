"use client";

import { FormEvent, useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type StripePaymentFormProps = {
  paymentId: string;
  amount: string;
  onError: (message: string) => void;
  onBusyChange: (busy: boolean) => void;
};

export default function StripePaymentForm({
  paymentId,
  amount,
  onError,
  onBusyChange,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onError("");

    if (!stripe || !elements) {
      onError("Payment form is still loading. Please try again.");
      return;
    }

    setSubmitting(true);
    onBusyChange(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?payment_id=${encodeURIComponent(
            paymentId,
          )}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        onError(
          result.error.message ||
            "Your payment could not be completed. Please try again.",
        );
        return;
      }

      /*
       * With redirect: "if_required", normal card payments can
       * complete without leaving Bloom & Petal.
       *
       * Payment methods that require a redirect are handled by
       * Stripe and return to the success page.
       */
      window.location.href = `/checkout/success?payment_id=${encodeURIComponent(
        paymentId,
      )}`;
    } catch {
      onError(
        "Something went wrong while processing your payment. Please try again.",
      );
    } finally {
      setSubmitting(false);
      onBusyChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-[#1f2a24]">
            Payment details
          </h3>

          <p className="mt-1 text-xs text-[#66736d]">
            Enter your payment details securely below.
          </p>
        </div>

        <div className="rounded-xl border border-[#e4e9e6] bg-white p-4">
          <PaymentElement
            options={{
              layout: {
                type: "accordion",
                defaultCollapsed: false,
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f5d50] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#264c41] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing payment..." : `Pay $${amount}`}
      </button>

      <p className="text-center text-xs text-[#78847e]">
        Payments are securely processed by Stripe.
      </p>
    </form>
  );
}
