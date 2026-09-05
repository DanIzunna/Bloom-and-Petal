"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, hydrated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (hydrated && token && id)
      api
        .order(id, token)
        .then((result) => setOrder(result.data))
        .catch((e) => setError(e.message));
  }, [hydrated, token, id]);
  if (!hydrated) return <LoadingState label="Loading order..." />;
  if (error || (hydrated && !token))
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center text-[#b65e6d]">
        {error || "Please sign in to view this order."}
        <Link
          href="/auth"
          className="mt-6 block text-xs font-bold uppercase tracking-widest text-[#68816e]"
        >
          Sign in
        </Link>
      </main>
    );
  if (!order)
    return (
      <main className="py-24 text-center font-sans text-3xl text-[#8b8178]">
        Loading order...
      </main>
    );
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 lg:px-10 lg:py-16">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#68816e]"
      >
        <ArrowLeft size={15} /> My orders
      </Link>
      <div className="mt-10 flex flex-wrap justify-between gap-5 border-b border-[#e8ded4] pb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b65e6d]">
            Order details
          </p>
          <h1 className="mt-2 font-sans text-5xl text-[#273d32]">
            {order.recipientName}
          </h1>
          <p className="mt-3 font-mono text-xs text-[#8b8178]">{order.id}</p>
        </div>
        <div className="text-right">
          <Badge tone={statusTone[order.status]}>{order.status}</Badge>
          <p className="mt-3 font-sans text-3xl text-[#273d32]">
            ${order.totalAmount}
          </p>
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {order.orderItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-[#e8ded4] pb-5"
            >
              <RemoteImage
                src={item.product.images[0]}
                alt={item.product.name}
                width={64}
                height={64}
                className="image-radius mr-4 size-16 object-cover"
              />
              <div>
                <h2 className="font-sans text-2xl text-[#273d32]">
                  {item.product.name}
                </h2>
                <p className="mt-1 text-sm text-[#8b8178]">
                  {item.quantity} × ${item.price}
                </p>
              </div>
              <p className="font-semibold text-[#273d32]">
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <aside className="bg-[#f3e8e3] p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-[#68756b]">
            Delivery
          </p>
          <p className="mt-3 text-sm leading-6 text-[#273d32]">
            {order.deliveryAddress}
          </p>
          <p className="mt-5 text-sm text-[#8b8178]">
            {new Date(order.deliveryDate).toLocaleDateString()}
          </p>
        </aside>
      </div>
    </main>
  );
}
