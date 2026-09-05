"use client";

import Link from "next/link";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Category, type Product } from "../../../lib/api";
import { useAuth } from "../../../lib/store/useAuth";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageContainer,
  Select,
} from "../../../components/ui";

export default function AdminProductsPage() {
  const token = useAuth((state) => state.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  useEffect(() => {
    if (!pendingDelete) return;
    document.getElementById("cancel-delete-product")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) setPendingDelete(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [pendingDelete, deleting]);
  function load() {
    if (!token) return;
    const query = new URLSearchParams({
      page: String(page),
      limit: "12",
      sortBy: "name",
      sortOrder: "asc",
    });
    if (search.trim()) query.set("search", search.trim());
    if (category) query.set("category", category);
    api
      .products(query.toString())
      .then((result) => {
        setProducts(result.items);
        setPages(result.pagination.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch(() => setError("Unable to load categories."));
  }, []);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, category, search]);
  async function remove(product: Product) {
    if (!token) return;
    setDeleting(product.id);
    try {
      await api.deleteProduct(product.id, token);
      setPendingDelete(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete product.");
    } finally {
      setDeleting(null);
    }
  }
  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="section-label">Catalog operations</p>
          <h1 className="mt-2 font-sans text-5xl text-[var(--foreground)]">
            Products.
          </h1>
        </div>
        <Link href="/admin-portal/products/new">
          <Button>
            <Plus size={16} /> New product
          </Button>
        </Link>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          aria-label="Search products"
        />
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      {error && (
        <div className="mt-5">
          <ErrorState message={error} />
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading products..." />
      ) : products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No products found"
            detail="Try another search or category filter."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)] text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Occasion</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--muted)]">
                  <td className="p-4 font-semibold">{product.name}</td>
                  <td className="p-4 text-[var(--muted-foreground)]">
                    {product.category.name}
                  </td>
                  <td className="p-4">${Number(product.price).toFixed(2)}</td>
                  <td className="p-4">
                    {product.stock === 0 ? (
                      <Badge tone="destructive">Out of stock</Badge>
                    ) : product.stock <= 5 ? (
                      <Badge tone="warning">{product.stock} left</Badge>
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td className="p-4 text-[var(--muted-foreground)]">
                    {product.occasion || "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin-portal/products/${product.id}/edit`}>
                        <Button
                          variant="ghost"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit3 size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        disabled={deleting === product.id}
                        onClick={() => setPendingDelete(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2
                          size={16}
                          className="text-[var(--destructive)]"
                        />
                      </Button>
                    </div>
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
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting)
              setPendingDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-message"
            className="surface w-full max-w-md p-6 sm:p-8"
          >
            <h2
              id="delete-product-title"
              className="font-sans text-3xl text-[var(--foreground)]"
            >
              Delete product?
            </h2>
            <p
              id="delete-product-message"
              className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]"
            >
              This will permanently delete {pendingDelete.name}. This action
              cannot be undone.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                id="cancel-delete-product"
                type="button"
                variant="secondary"
                onClick={() => setPendingDelete(null)}
                disabled={Boolean(deleting)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => remove(pendingDelete)}
                disabled={Boolean(deleting)}
                className="bg-[var(--destructive)] hover:bg-[var(--destructive)]"
              >
                {deleting ? "Deleting..." : "Delete product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
