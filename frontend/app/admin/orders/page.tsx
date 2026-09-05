"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Order } from "../../../lib/api";
import { useAuth } from "../../../lib/store/useAuth";
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  Select,
  Button,
} from "../../../components/ui";

const tone = {
  PENDING: "warning",
  PROCESSING: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
} as const;
export default function AdminOrdersPage() {
  const token = useAuth((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    const query = new URLSearchParams({
      page: String(page),
      limit: "12",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    if (status) query.set("status", status);
    api
      .adminOrders(token, query.toString())
      .then((result) => {
        setOrders(result.data.items);
        setPages(result.data.pagination.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, page, status]);
  return (
    <PageContainer>
      <p className="section-label">Store operations</p>
      <h1 className="mt-2 font-sans text-5xl text-[var(--foreground)]">
        Orders.
      </h1>
      <div className="mt-8 max-w-xs">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter orders by status"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>
      {error && (
        <div className="mt-6">
          <ErrorState message={error} />
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading orders..." />
      ) : orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No orders found"
            detail="There are no orders matching this status filter."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)] text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Created</th>
                <th className="p-4">Delivery</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--muted)]">
                  <td className="p-4 font-mono text-xs">{order.id}</td>
                  <td className="p-4 font-semibold">{order.recipientName}</td>
                  <td className="p-4 text-[var(--muted-foreground)]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-[var(--muted-foreground)]">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-semibold">${order.totalAmount}</td>
                  <td className="p-4">
                    <Badge tone={tone[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin-portal/orders/${order.id}`}>
                      <Button variant="ghost">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6 flex items-center justify-center gap-5">
        <Button
          variant="ghost"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-[var(--muted-foreground)]">
          {page} / {pages}
        </span>
        <Button
          variant="ghost"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </PageContainer>
  );
}
