"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import {
  api,
  type Category,
  type Product,
  type ProductInput,
} from "../../lib/api";
import { Button, Input, Select, Textarea } from "../ui";

export default function ProductForm({
  product,
  token,
  onSaved,
}: {
  product?: Product;
  token: string;
  onSaved: (product: Product) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    stock: String(product?.stock ?? ""),
    categoryId: product?.category.id || "",
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(
    product?.imageUrl || null,
  );
  const [uploadedImage, setUploadedImage] = useState<{
    url: string;
    publicId: string;
  } | null>(
    product?.imageUrl && product?.imagePublicId
      ? { url: product.imageUrl, publicId: product.imagePublicId }
      : null,
  );

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch(() => setError("Unable to load categories."));
  }, []);

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function categorySlug(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    const slug = categorySlug(name);
    if (name.length < 2 || slug.length < 2) {
      setError("Category name must contain at least 2 valid characters.");
      return;
    }
    setCategoryBusy(true);
    setError("");
    try {
      const created = await api.createCategory({ name, slug }, token);
      setCategories((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      update("categoryId", created.id);
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create category.");
    } finally {
      setCategoryBusy(false);
    }
  }

  function processFile(file: File) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setSelectedFile(file);
    setUploadSuccess(false);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  async function uploadImage() {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const response = await api.uploadProductImage(selectedFile, token);
      setUploadedImage({
        url: response.data.url,
        publicId: response.data.publicId,
      });
      setUploadSuccess(true);
      setSelectedFile(null);
      // Reset success message after 2 seconds
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to upload image. Try again.",
      );
      setFilePreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setUploadedImage(null);
    setFilePreview(null);
    setSelectedFile(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    // For new products, require imageUrl (either just uploaded or legacy images)
    if (!product && !uploadedImage?.url) {
      setError("Please upload a product image before creating.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.categoryId ||
      Number(form.price) < 0 ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      setError("Complete all required fields with valid values.");
      return;
    }

    const data: ProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: form.categoryId,
      ...(uploadedImage && {
        imageUrl: uploadedImage.url,
        imagePublicId: uploadedImage.publicId,
      }),
    };

    setBusy(true);
    try {
      const saved = product
        ? await api.updateProduct(product.id, data, token)
        : await api.createProduct(data, token);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-widest">
          Name
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-2"
            required
          />
        </label>
        <div className="text-xs font-bold uppercase tracking-widest">
          <label htmlFor="product-category">Category</label>
          <Select
            id="product-category"
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="mt-2"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {!creatingCategory ? (
            <button
              type="button"
              onClick={() => setCreatingCategory(true)}
              className="mt-2 text-xs font-bold normal-case tracking-normal text-[var(--primary)] hover:text-[var(--primary-dark)]"
            >
              + Create new category
            </button>
          ) : (
            <div className="mt-3 space-y-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--muted)] p-3">
              <label
                htmlFor="new-category-name"
                className="block text-xs normal-case tracking-normal text-[var(--muted-foreground)]"
              >
                Category name
              </label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="e.g. Housewarming"
                disabled={categoryBusy}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={createCategory}
                  disabled={categoryBusy}
                >
                  {categoryBusy ? "Creating..." : "Create category"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreatingCategory(false)}
                  disabled={categoryBusy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        <label className="text-xs font-bold uppercase tracking-widest">
          Price
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            className="mt-2"
            required
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest">
          Stock
          <Input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => update("stock", e.target.value)}
            className="mt-2"
            required
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest lg:col-span-2">
          Description
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="mt-2 min-h-28"
            required
          />
        </label>
      </div>

      {/* Image Upload Section */}
      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <label
          htmlFor="product-image"
          className="text-xs font-bold uppercase tracking-widest block"
        >
          Product Image
        </label>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          id="product-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="sr-only"
          aria-label="Select product image"
        />

        {/* No image uploaded yet - show empty upload area or edit existing */}
        {!uploadedImage?.url ? (
          <div
            className={`mt-4 cursor-pointer transition-all ${
              dragActive
                ? "border-2 border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-2 border-dashed border-[var(--border)]"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !uploading) {
                fileInputRef.current?.click();
              }
            }}
          >
            {/* Empty state - no file selected */}
            {!filePreview ? (
              <div className="px-6 py-12 sm:px-8 sm:py-16 text-center">
                <ImageIcon
                  size={32}
                  strokeWidth={1.5}
                  className="mx-auto mb-4 text-[var(--muted-foreground)]"
                />
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Choose an image
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  or drag and drop
                </p>
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  JPG, PNG or WebP · Max 5MB
                </p>
              </div>
            ) : (
              /* Selected but not uploaded yet */
              <div className="px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex gap-4 items-center">
                  <div className="image-radius relative flex-shrink-0 overflow-hidden border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="image-radius h-20 w-20 object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {selectedFile &&
                        (selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                      MB
                    </p>
                    {uploading ? (
                      <p className="text-xs text-[var(--primary)] mt-2 font-medium">
                        Uploading...
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)] mt-2">
                        Click to replace or drag another image
                      </p>
                    )}
                  </div>
                </div>
                {selectedFile && !uploading && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadImage();
                      }}
                      disabled={uploading}
                      className="flex-1"
                    >
                      Upload Image
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFilePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      disabled={uploading}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Image successfully uploaded - show preview and replace option */
          <div className="mt-4">
            <div className="image-radius relative inline-block overflow-hidden border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage.url}
                alt="Uploaded product image"
                className="image-radius h-40 w-40 object-cover"
              />
            </div>
            {uploadSuccess && (
              <p className="mt-3 text-xs font-medium text-[var(--primary)]">
                ✓ Image uploaded
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={removeImage}
              disabled={uploading || busy}
              className="mt-3"
            >
              Replace image
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-6 text-sm text-[var(--destructive)]">{error}</p>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          disabled={
            busy ||
            uploading ||
            (!product && !uploadedImage?.url && selectedFile !== null)
          }
        >
          {busy ? "Saving..." : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
