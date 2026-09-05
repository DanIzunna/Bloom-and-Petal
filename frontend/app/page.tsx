"use client";

import Link from "next/link";
import { ArrowRight, Gift, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import RemoteImage from "../components/RemoteImage";
import { api, imageFor, type Category, type Product } from "../lib/api";

const categoryFallbacks: Record<string, string> = {
  bouquets:
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85",
  "indoor-plants":
    "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85",
  "dried-flowers":
    "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1200&q=85",
  sympathy:
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85",
  birthday:
    "https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=1200&q=85",
};

const momentLinks = [
  {
    label: "Birthday",
    slug: "birthday",
    detail: "A bright gesture, beautifully chosen.",
  },
  {
    label: "Anniversary",
    search: "rose",
    detail: "Mark the date with something lasting.",
  },
  {
    label: "Sympathy",
    slug: "sympathy",
    detail: "Quiet flowers for tender moments.",
  },
  {
    label: "Everyday",
    search: "",
    detail: "A small reason is still a reason.",
  },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.products("limit=100&sortBy=name&sortOrder=asc"),
      api.categories(),
    ])
      .then(([productResult, categoryResult]) => {
        setProducts(productResult.items);
        setCategories(categoryResult);
      })
      .catch(() =>
        setError("We are having trouble loading the collection right now."),
      )
      .finally(() => setLoading(false));
  }, []);
  const collections = useMemo(
    () =>
      categories.filter((category) =>
        ["bouquets", "indoor-plants", "dried-flowers"].includes(category.slug),
      ),
    [categories],
  );
  const featured = products.slice(0, 4);
  const productForCategory = (category: Category) =>
    products.find((product) => product.category.slug === category.slug);
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--background)]">
        <div className="relative min-h-[500px] lg:min-h-[620px]">
          <RemoteImage
            src="https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1800&q=90"
            alt="A field of delicate flowers"
            fill
            priority
            sizes="100vw"
            className="image-radius absolute inset-0 h-full w-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(250_247_242_/_0.96)] via-[rgb(250_247_242_/_0.68)] to-[rgb(250_247_242_/_0.3)] lg:bg-gradient-to-r lg:from-[rgb(250_247_242_/_0.96)] lg:via-[rgb(250_247_242_/_0.68)] lg:to-transparent" />
          <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-5 py-16 text-center lg:min-h-[620px] lg:px-10 lg:py-20 lg:text-left">
            <div className="max-w-lg lg:max-w-xl">
              <p className="section-label">
                Bloom &amp; Petal · Seasonal collection
              </p>
              <h1 className="mx-auto mt-4 max-w-[18rem] font-sans text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--foreground)] sm:max-w-xl sm:text-6xl lg:mx-0 lg:mt-5 lg:text-7xl">
                Let the gesture speak for itself.
              </h1>
              <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[var(--muted-foreground)] lg:mx-0 lg:mt-6">
                Seasonal stems, easygoing plants, and thoughtful gifts for
                sending something beautiful.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:mt-8 lg:justify-start">
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center gap-3 rounded-[0.5rem_0.85rem_0.5rem_0.35rem] bg-[var(--primary)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--primary-dark)] focus-visible:ring-2"
                >
                  Shop flowers <ArrowRight size={16} />
                </Link>
                <Link
                  href="/products?category=indoor-plants"
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-[var(--primary)] bg-[rgb(250_247_242_/_0.82)] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)] transition hover:bg-[var(--background)]"
                >
                  Bring home something green
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="section-label">Shop with intention</p>
            <h2 className="mt-2 font-sans text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
              Find your kind of beautiful
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--primary)] sm:flex"
          >
            All products <ArrowRight size={15} />
          </Link>
        </div>
        {error ? (
          <p className="text-sm text-[var(--destructive)]">{error}</p>
        ) : loading ? (
          <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
            Gathering the collection...
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {collections.map((category) => {
              const product = productForCategory(category);
              return (
                <Link
                  href={`/products?category=${category.slug}`}
                  key={category.id}
                  className="group relative overflow-hidden image-radius bg-[var(--secondary)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--border)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="relative aspect-[1.15]">
                    <RemoteImage
                      src={
                        product
                          ? imageFor(product)
                          : categoryFallbacks[category.slug]
                      }
                      alt={category.name}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="image-radius h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(35_72_62_/_0.86)] to-transparent px-5 pb-5 pt-16 text-white">
                    <p className="text-xs uppercase tracking-widest text-white/75">
                      {category._count?.products ?? 0} pieces to explore
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <section className="px-5 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="section-label">Selected today</p>
              <h2 className="mt-2 font-sans text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
                Bestsellers
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--primary)] sm:flex"
            >
              Explore all <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
              Loading flowers...
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
        <div className="relative min-h-[390px] overflow-hidden image-radius bg-[var(--secondary)]">
          <RemoteImage
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&q=85"
            alt="Soft seasonal flowers arranged in a vase"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="image-radius h-full w-full object-cover"
          />
        </div>
        <div className="max-w-lg">
          <p className="section-label">Made for the in-between moments</p>
          <h2 className="mt-3 font-sans text-4xl font-semibold leading-tight text-[var(--foreground)]">
            A little beauty goes a long way.
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--muted-foreground)]">
            Choose by color, feeling, or instinct. The rest is up to you.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
          >
            Browse the collection <ArrowRight size={15} />
          </Link>
        </div>
      </section>
      <section className="px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="section-label">Shop by feeling</p>
            <h2 className="mt-2 font-sans text-3xl font-semibold text-[var(--foreground)]">
              For whatever today holds
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {momentLinks.map((moment) => (
              <Link
                key={moment.label}
                href={
                  moment.slug
                    ? `/products?category=${moment.slug}`
                    : moment.search
                      ? `/products?search=${moment.search}`
                      : "/products"
                }
                className="surface group border-l-2 border-l-[var(--border)] px-5 py-5 transition hover:-translate-y-0.5 hover:border-l-[var(--accent)] hover:shadow-[var(--shadow-lift)]"
              >
                <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                  {moment.label}
                </h3>
                <p className="mt-2 text-sm leading-5 text-[var(--muted-foreground)]">
                  {moment.detail}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
        <div className="mb-8">
          <p className="section-label">Why Bloom &amp; Petal</p>
          <h2 className="mt-2 font-sans text-3xl font-semibold text-[var(--foreground)]">
            Thoughtful by nature.
          </h2>
        </div>
        <div className="grid gap-8 border-t border-[var(--border)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <Value
            icon={Sparkles}
            title="A real collection"
            text="A focused collection of flowers, plants, and dried arrangements."
          />
          <Value
            icon={Leaf}
            title="Care included"
            text="Practical care notes help every choice settle in beautifully."
          />
          <Value
            icon={Gift}
            title="For the moment"
            text="Choose by collection, occasion, or the feeling you want to share."
          />
          <Value
            icon={ShieldCheck}
            title="Safe & secure"
            text="A considered experience from first look to final detail."
          />
        </div>
      </section>
      <section className="border-t border-[var(--border)] px-5 py-12 lg:px-10 lg:py-16">
        <div className="surface mx-auto max-w-7xl bg-[var(--secondary)] px-5 py-14 text-center sm:px-10 lg:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            A good day to send flowers
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.02em] text-[var(--foreground)] sm:text-5xl">
            Find something worth sending.
          </h2>
          <Link
            href="/products"
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-[0.5rem_0.85rem_0.5rem_0.35rem] bg-[var(--primary)] px-6 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--primary-dark)]"
          >
            Shop flowers <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Value({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Leaf;
  title: string;
  text: string;
}) {
  return (
    <div>
      <Icon size={21} className="text-[var(--accent)]" />
      <h3 className="mt-4 font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {text}
      </p>
    </div>
  );
}
