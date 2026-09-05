"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard";
import { api, type Category, type Product } from "../../lib/api";
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
} from "../../components/ui";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("category") || "",
  );
  const [search, setSearch] = useState(() =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("search") || "",
  );
  const [maxPrice, setMaxPrice] = useState(100);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch(() => setError("Unable to load categories."));
  }, []);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      limit: "12",
      sortBy,
      sortOrder,
    });
    if (search.trim()) query.set("search", search.trim());
    if (category) query.set("category", category);
    api
      .products(query.toString())
      .then((result) => {
        if (!active) return;
        setError("");
        setProducts(
          result.items.filter((item) => Number(item.price) <= maxPrice),
        );
        setTotalResults(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((requestError) => {
        if (!active || requestError?.name === "AbortError") return;
        setError("Unable to load blooms right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, category, search, maxPrice, sortBy, sortOrder]);
  const filterCount = Number(Boolean(category)) + Number(maxPrice < 100);
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );
  const beginRequest = () => {
    setLoading(true);
    setError("");
  };
  const clearFilters = () => {
    beginRequest();
    setCategory("");
    setSearch("");
    setMaxPrice(100);
    setPage(1);
    setFiltersOpen(false);
    setError("");
  };
  const filters = (
    <>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
        Search
        <Input
          value={search}
          onChange={(e) => {
            beginRequest();
            setSearch(e.target.value);
            setPage(1);
            setError("");
          }}
          placeholder="Search blooms"
          className="mt-2"
        />
      </label>
      <div className="space-y-1">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
          Category
        </p>
        <button
          onClick={() => {
            beginRequest();
            clearFilters();
          }}
          className={`block w-full rounded px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${!category ? "bg-[var(--primary)] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"}`}
        >
          All flowers
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              beginRequest();
              setCategory(item.slug);
              setPage(1);
              setFiltersOpen(false);
              setError("");
            }}
            className={`block w-full rounded px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${category === item.slug ? "bg-[var(--primary)] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
        Maximum price <span className="float-right">${maxPrice}</span>
        <input
          type="range"
          min="25"
          max="100"
          step="5"
          value={maxPrice}
          onChange={(e) => {
            beginRequest();
            setMaxPrice(Number(e.target.value));
            setPage(1);
          }}
          className="mt-4 w-full accent-[var(--primary)]"
        />
      </label>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
        Sort
        <Select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            beginRequest();
            const [nextBy, nextOrder] = e.target.value.split(":");
            setSortBy(nextBy);
            setSortOrder(nextOrder);
            setPage(1);
            setError("");
          }}
          className="mt-2"
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="price:asc">Price low to high</option>
          <option value="price:desc">Price high to low</option>
        </Select>
      </label>
    </>
  );
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end">
        <div>
          <p className="section-label">The collection</p>
          <h1 className="mt-2 font-sans text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            Flowers &amp; plants
          </h1>
        </div>
        <p className="max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">
          Seasonal flowers, easy-care plants, and pieces that make a room feel
          more like home.
        </p>
      </div>
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={16} /> Filters
          {filterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--primary)] text-[10px] text-white">
              {filterCount}
            </span>
          )}
        </Button>
        <span className="text-sm text-[var(--muted-foreground)]">
          {loading ? "Loading..." : error ? "" : `${totalResults} blooms`}
        </span>
      </div>
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setFiltersOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-md)] bg-[var(--background)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-sans text-3xl">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-6">{filters}</div>
          </aside>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-1">
        <aside className="hidden items-end gap-5 border-b border-[var(--border)] pb-6 lg:flex [&>label]:flex-1 [&>label:first-child]:max-w-xs [&>label:nth-child(3)]:max-w-xs [&>label:nth-child(4)]:max-w-xs [&>div]:flex-[1.4] [&>div>div]:flex [&>div>div]:flex-wrap [&>div>div]:gap-1 [&>div>div>button]:w-auto [&>div>div>button]:px-3">
          {filters}
        </aside>
        <section>
          <div className="mb-6 hidden items-center justify-between text-sm text-[var(--muted-foreground)] lg:flex">
            <span>
              {loading
                ? "Loading blooms..."
                : error
                  ? ""
                  : `${totalResults} blooms to explore`}
            </span>
            <span>Freshly arranged for you</span>
          </div>
          {error ? (
            <div>
              <ErrorState message={error} />
              <button
                onClick={clearFilters}
                className="mx-auto mt-4 block text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
              >
                Clear filters
              </button>
            </div>
          ) : loading ? (
            <LoadingState label="Gathering something beautiful..." />
          ) : products.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  disabled={page <= 1}
                  aria-label="Previous page"
                  onClick={() => {
                    beginRequest();
                    setPage(page - 1);
                  }}
                >
                  Previous
                </Button>
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-label={`Go to page ${pageNumber}`}
                    aria-current={pageNumber === page ? "page" : undefined}
                    disabled={loading}
                    onClick={() => {
                      beginRequest();
                      setPage(pageNumber);
                    }}
                    className={`grid size-10 place-items-center rounded-[var(--radius-sm)] border text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${pageNumber === page ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"}`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <Button
                  variant="ghost"
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  onClick={() => {
                    beginRequest();
                    setPage(page + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              title="Nothing in this range yet"
              detail="Try a different category or price range."
              action={
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
                >
                  Clear filters
                </button>
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}
