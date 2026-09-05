"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Store,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/store/useAuth";
import AdminLogin from "./AdminLogin";

const storageKey = "bloom-petal-admin-sidebar-collapsed";
const links = [
  { href: "/admin-portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-portal/products", label: "Products", icon: Package },
  { href: "/admin-portal/orders", label: "Orders", icon: ShoppingCart },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, hydrated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(storageKey) === "true",
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name?.trim() || "Store Admin";
  const displayEmail = user?.email?.trim() || "Administrator account";
  useEffect(() => {
    if (hydrated && user && user.role !== "ADMIN") router.replace("/");
  }, [hydrated, user, router]);
  useEffect(() => {
    window.localStorage.setItem(storageKey, String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    if (!accountOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      )
        setAccountOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [accountOpen]);
  if (!hydrated) return <div className="min-h-screen bg-[var(--background)]" />;
  if (!token || !user) return <AdminLogin />;
  if (user.role !== "ADMIN")
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-16">
        <div className="surface max-w-md p-8 text-center">
          <h1 className="font-sans text-4xl text-[var(--foreground)]">
            Admin access required.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            This area is reserved for authorized store administrators.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 text-xs font-bold uppercase tracking-widest text-white"
          >
            Return to storefront
          </Link>
        </div>
      </main>
    );
  const signOut = () => {
    setAccountOpen(false);
    logout();
    router.push("/");
  };
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={`${collapsed ? "lg:w-20 lg:px-3" : "lg:w-72 lg:px-6"} hidden fixed inset-y-0 left-0 z-50 flex-col border-r border-[var(--border)] bg-white p-5 transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen`}
        >
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <Link
              href="/"
              title="View storefront"
              className={`font-sans text-3xl font-semibold text-[var(--primary)] ${collapsed ? "lg:hidden" : ""}`}
            >
              Bloom <span className="text-[var(--accent)]">&amp;</span> Petal
            </Link>
            <button
              onClick={() => setCollapsed((value) => !value)}
              aria-label={
                collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"
              }
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="rounded-[var(--radius-sm)] p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
          </div>
          <p className={`mt-10 section-label ${collapsed ? "lg:hidden" : ""}`}>
            Store operations
          </p>
          <nav className="mt-4 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${collapsed ? "lg:justify-center" : ""} ${pathname === href || (href !== "/admin-portal" && pathname.startsWith(href)) ? "bg-[var(--primary)] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"}`}
              >
                <Icon size={17} />
                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-[var(--border)] pt-4">
            <Link
              href="/"
              title={collapsed ? "View Store" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] ${collapsed ? "lg:justify-center" : ""}`}
            >
              <Store size={17} />
              <span className={collapsed ? "lg:hidden" : ""}>View Store</span>
            </Link>
            <div ref={accountRef} className="relative mt-2">
              <button
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                title={
                  collapsed
                    ? `${displayName}, ${displayEmail}, ADMIN`
                    : undefined
                }
                className={`flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left hover:bg-[var(--muted)] ${collapsed ? "lg:justify-center" : ""}`}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--secondary)] text-xs font-bold text-[var(--primary)]">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className={collapsed ? "lg:hidden" : "min-w-0"}>
                  <strong className="block truncate text-sm text-[var(--foreground)]">
                    {displayName}
                  </strong>
                  <span className="block truncate text-xs text-[var(--muted-foreground)]">
                    {displayEmail}
                  </span>
                  <span className="block text-[10px] font-bold tracking-widest text-[var(--primary)]">
                    ADMIN
                  </span>
                </span>
              </button>
              {accountOpen && (
                <div className="surface absolute bottom-14 left-0 z-10 w-56 p-2">
                  <p className="border-b border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                    {displayEmail}
                  </p>
                  <Link
                    href="/"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded px-3 py-2 text-sm hover:bg-[var(--muted)]"
                  >
                    View Store
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full rounded px-3 py-2 text-left text-sm text-[var(--destructive)] hover:bg-[var(--muted)]"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="px-5 pb-28 pt-8 lg:px-10 lg:pb-10 lg:pt-9">
            {children}
          </div>
        </main>
      </div>
      <nav
        aria-label="Admin navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[var(--border)] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(39_51_47_/_0.08)] backdrop-blur lg:hidden"
      >
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest ${pathname === href || (href !== "/admin-portal" && pathname.startsWith(href)) ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
