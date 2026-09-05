"use client";

import { useRouter } from "next/navigation";
import ProductForm from "../../../../components/admin/ProductForm";
import { PageContainer } from "../../../../components/ui";
import { useAuth } from "../../../../lib/store/useAuth";

export default function NewProductPage() {
  const token = useAuth((state) => state.token);
  const router = useRouter();
  if (!token) return null;
  return (
    <PageContainer>
      <p className="section-label">Catalog operations</p>
      <h1 className="mt-2 font-sans text-5xl text-[var(--foreground)]">
        New product.
      </h1>
      <div className="mt-8">
        <ProductForm
          token={token}
          onSaved={(product) =>
            router.push(`/admin-portal/products/${product.id}/edit`)
          }
        />
      </div>
    </PageContainer>
  );
}
