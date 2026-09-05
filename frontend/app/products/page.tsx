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
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
    setFiltersOpen(false);
    setError("");
  };

  const selectCategory = (slug: string) => {
    beginRequest();
    setCategory(slug);
    setPage(1);
    setFiltersOpen(false);
    setError("");
  };

  const filterControls = (
    <>
      <label className="block min-w-0">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          Search
        </span>
        <Input
          value={search}
          onChange={(e) => {
            beginRequest();
            setSearch(e.target.value);
            setPage(1);
            setError("");
          }}
          placeholder="Search blooms"
        />
      </label>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          Category
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              !category
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            }`}
          >
            All
          </button>

          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectCategory(item.slug)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                category === item.slug
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          <span>Maximum price</span>
          <span className="text-[var(--foreground)]">${maxPrice}</span>
        </div>

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
          className="mt-1 w-full accent-[var(--primary)]"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          Sort
        </span>

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
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-10 lg:px-10 lg:py-12">
      <header className="mb-7 flex flex-col gap-3 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">The collection</p>
          <h1 className="mt-2 font-sans text-3xl font-semibold tracking-[-0.02em] text-[var(--foreground)] sm:text-4xl">
            Flowers &amp; plants
          </h1>
        </div>

        <p className="max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
          Seasonal flowers, easy-care plants, and pieces that make a room feel
          more like home.
        </p>
      </header>

      {/* Mobile filter trigger */}
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={16} />
          Filters
          {filterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--primary)] text-[10px] text-white">
              {filterCount}
            </span>
          )}
        </Button>

        <span className="text-xs text-[var(--muted-foreground)]">
          {loading ? "Loading..." : error ? "" : `${totalResults} blooms`}
        </span>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setFiltersOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[1.25rem] bg-[var(--background)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="section-label">Refine</p>
                <h2 className="mt-1 font-sans text-3xl text-[var(--foreground)]">
                  Filters
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="grid size-10 place-items-center rounded-full border border-[var(--border)] bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-7">{filterControls}</div>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-7 w-full border-t border-[var(--border)] pt-5 text-xs font-bold uppercase tracking-[0.15em] text-[var(--primary)]"
            >
              Clear all filters
            </button>
          </aside>
        </div>
      )}

      {/* Desktop filter toolbar */}
      <section className="hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)] lg:block">
        <div className="grid grid-cols-[minmax(210px,0.8fr)_minmax(0,1.8fr)_180px_190px] items-end gap-5">
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Search
            </span>
            <Input
              value={search}
              onChange={(e) => {
                beginRequest();
                setSearch(e.target.value);
                setPage(1);
                setError("");
              }}
              placeholder="Search blooms"
            />
          </label>

          <div className="min-w-0">
            <p className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Category
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => selectCategory("")}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                  !category
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                }`}
              >
                All
              </button>

              {categories.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectCategory(item.slug)}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    category === item.slug
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <span>Max price</span>
              <span className="text-[var(--foreground)]">${maxPrice}</span>
            </div>

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
              className="mt-1 w-full accent-[var(--primary)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Sort
            </span>

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
            >
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="price:asc">Price low to high</option>
              <option value="price:desc">Price high to low</option>
            </Select>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            {loading
              ? "Loading blooms..."
              : error
                ? ""
                : `${totalResults} blooms to explore`}
          </p>

          {(category || search || maxPrice < 100) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--primary)] hover:text-[var(--accent)]"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="mt-7">
        {error ? (
          <div>
            <ErrorState message={error} />
            <button
              type="button"
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
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                  className={`grid size-10 place-items-center rounded-[var(--radius-sm)] border text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                    pageNumber === page
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
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
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
              >
                Clear filters
              </button>
            }
          />
        )}
      </section>
    </main>
  );
}
