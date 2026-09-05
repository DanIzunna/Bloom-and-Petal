"use client";

import Link from "next/link";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/store/useAuth";
import { useCart } from "../lib/store/useCart";

export default function Navbar() {
  const count = useCart((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const { user, hydrated, loadUser, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountOpen && !mobileOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (
        accountOpen &&
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      )
        setAccountOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [accountOpen, mobileOpen]);
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setAccountOpen(false);
    setMobileOpen(false);
    if (search.trim())
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
  }
  function closeMenus() {
    setAccountOpen(false);
    setMobileOpen(false);
  }
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgb(250_247_242_/_0.94)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-10">
        <Link
          href="/"
          onClick={closeMenus}
          className="shrink-0 font-sans text-2xl font-semibold tracking-[-0.04em] text-[var(--primary)] sm:text-[1.7rem]"
        >
          Bloom <span className="text-[var(--accent)]">&amp;</span> Petal
        </Link>
        <nav className="hidden items-center gap-1 text-xs font-semibold tracking-[0.08em] text-[var(--muted-foreground)] lg:flex">
          <Link
            className={`rounded-[var(--radius-sm)] px-3 py-2 transition border-b-2 border-b-transparent hover:border-b-[var(--primary)] hover:text-[var(--primary)] focus-visible:bg-[var(--muted)] ${pathname.startsWith("/products") ? "border-b-[var(--primary)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
            href="/products"
            onClick={closeMenus}
          >
            Shop
          </Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <form
            onSubmit={submitSearch}
            className="hidden h-10 items-center gap-2 border-b border-[var(--border)] px-1 sm:flex"
          >
            <Search
              size={17}
              strokeWidth={1.5}
              className="text-[var(--muted-foreground)]"
            />
            <input
              aria-label="Search products"
              placeholder="Search blooms"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-32 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </form>
          <Link
            href="/cart"
            onClick={closeMenus}
            aria-label={`Shopping bag with ${count} items`}
            className={`relative grid size-10 place-items-center rounded-[var(--radius-sm)] transition border-b-2 border-b-transparent hover:border-b-[var(--primary)] hover:text-[var(--primary)] ${pathname.startsWith("/cart") ? "border-b-[var(--primary)] text-[var(--primary)]" : "text-[var(--foreground)]"}`}
          >
            <ShoppingBag size={20} strokeWidth={1.6} />
            {count > 0 && (
              <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <div ref={accountRef} className="relative hidden sm:block">
            <button
              onClick={() => setAccountOpen((open) => !open)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-semibold tracking-[0.08em] transition border-b-2 border-b-transparent hover:border-b-[var(--primary)] hover:text-[var(--primary)] ${pathname.startsWith("/orders") || pathname === "/auth" ? "border-b-[var(--primary)] text-[var(--primary)]" : "text-[var(--foreground)]"}`}
            >
              <UserRound size={16} strokeWidth={1.8} />
              <span>Account</span>
              <ChevronDown
                size={14}
                className={accountOpen ? "rotate-180 transition" : "transition"}
              />
            </button>
            {accountOpen && (
              <div
                className="surface absolute right-0 top-12 w-48 p-2"
                role="menu"
              >
                {hydrated && user ? (
                  <>
                    <p className="border-b border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                      {user.name}
                    </p>
                    <Link
                      onClick={closeMenus}
                      className="block rounded px-3 py-2 text-sm hover:bg-[var(--muted)]"
                      href={user.role === "ADMIN" ? "/" : "/orders"}
                    >
                      {user.role === "ADMIN" ? "View Store" : "My orders"}
                    </Link>
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm text-[var(--destructive)] hover:bg-[var(--muted)]"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      onClick={closeMenus}
                      className="block rounded px-3 py-2 text-sm hover:bg-[var(--muted)]"
                      href="/auth"
                    >
                      Login
                    </Link>
                    <Link
                      onClick={closeMenus}
                      className="block rounded px-3 py-2 text-sm hover:bg-[var(--muted)]"
                      href="/auth"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--primary)] transition hover:bg-[var(--muted)] lg:hidden"
            onClick={() => {
              setAccountOpen(false);
              setMobileOpen((open) => !open);
            }}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 lg:hidden">
          <form
            onSubmit={submitSearch}
            className="mb-4 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3"
          >
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search blooms"
              className="min-h-11 flex-1 bg-transparent text-sm outline-none"
            />
          </form>
          <div className="grid gap-1 text-sm">
            <Link
              className="rounded px-3 py-3 hover:bg-[var(--muted)]"
              href="/products"
              onClick={closeMenus}
            >
              Shop all
            </Link>
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link
                    onClick={closeMenus}
                    className="rounded px-3 py-3 hover:bg-[var(--muted)]"
                    href="/"
                  >
                    View Store
                  </Link>
                ) : (
                  <Link
                    onClick={closeMenus}
                    className="rounded px-3 py-3 hover:bg-[var(--muted)]"
                    href="/orders"
                  >
                    My orders
                  </Link>
                )}
                <button
                  onClick={() => {
                    closeMenus();
                    logout();
                  }}
                  className="rounded px-3 py-3 text-left text-[var(--destructive)] hover:bg-[var(--muted)]"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                className="rounded px-3 py-3 hover:bg-[var(--muted)]"
                href="/auth"
                onClick={closeMenus}
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
