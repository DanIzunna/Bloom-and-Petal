"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/store/useAuth";
import { Button, Input } from "../ui";

export default function AdminLogin() {
  const router = useRouter();
  const signIn = useAuth((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
      const role = useAuth.getState().user?.role;
      router.replace(role === "ADMIN" ? "/admin-portal" : "/");
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Unable to sign in.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-16">
      <div className="surface w-full max-w-md p-8 sm:p-10">
        <p className="section-label">Bloom &amp; Petal operations</p>
        <h1 className="mt-3 font-sans text-5xl text-[var(--foreground)]">
          Admin sign in.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Use an authorized administrator account to manage the store.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-xs font-bold uppercase tracking-widest">
            Email
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-widest">
            Password
            <Input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2"
            />
          </label>
          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}
          <Button disabled={busy} className="w-full">
            {busy ? "Signing in..." : "Sign in to admin portal"}
          </Button>
        </form>
        <Link
          href="/"
          className="mt-6 block text-center text-xs font-bold uppercase tracking-widest text-[var(--primary)]"
        >
          Return to storefront
        </Link>
      </div>
    </main>
  );
}
