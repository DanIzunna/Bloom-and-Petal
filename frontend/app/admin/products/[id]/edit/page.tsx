"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductForm from "../../../../../components/admin/ProductForm";
import { api, type Product } from "../../../../../lib/api";
import { useAuth } from "../../../../../lib/store/useAuth";
import {
  ErrorState,
  LoadingState,
  PageContainer,
} from "../../../../../components/ui";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuth((state) => state.token);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (id)
      api
        .product(id)
        .then(setProduct)
        .catch((e) => setError(e.message));
  }, [id]);
  if (!token) return null;
  if (error)
    return (
      <PageContainer>
        <ErrorState message={error} />
      </PageContainer>
    );
  if (!product) return <LoadingState label="Loading product..." />;
  return (
    <PageContainer>
      <Link
        href="/admin-portal/products"
        className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
      >
        ← Back to products
      </Link>
      <p className="mt-8 section-label">Catalog operations</p>
      <h1 className="mt-2 font-sans text-5xl text-[var(--foreground)]">
        Edit product.
      </h1>
      <div className="mt-8">
        <ProductForm
          product={product}
          token={token}
          onSaved={(saved) => {
            setProduct(saved);
            router.push("/admin-portal/products");
          }}
        />
      </div>
    </PageContainer>
  );
}
