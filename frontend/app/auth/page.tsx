"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/store/useAuth";

export default function AuthPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  useEffect(() => {
    if (auth.user)
      router.replace(
        auth.user.role === "ADMIN" ? "/admin-portal" : "/products",
      );
  }, [auth.user, router]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register) await auth.register(name, email, password);
      else await auth.signIn(email, password);
      router.push(
        useAuth.getState().user?.role === "ADMIN"
          ? "/admin-portal"
          : "/products",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto w-full max-w-md px-5 py-20">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#b65e6d]">
        Welcome to Bloom &amp; Petal
      </p>
      <h1 className="mt-3 text-center font-sans text-5xl text-[#273d32]">
        {register ? "Create an account." : "Welcome back."}
      </h1>
      <form onSubmit={submit} className="mt-12 bg-[#f3e8e3] p-8 sm:p-10">
        {register && (
          <label className="mb-5 block text-xs font-bold uppercase tracking-[0.14em] text-[#68756b]">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full border-b border-[#cfc0b5] bg-transparent py-3 text-sm font-normal normal-case tracking-normal outline-none"
            />
          </label>
        )}
        <label className="mb-5 block text-xs font-bold uppercase tracking-[0.14em] text-[#68756b]">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-[#cfc0b5] bg-transparent py-3 text-sm font-normal normal-case tracking-normal outline-none"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#68756b]">
          Password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-[#cfc0b5] bg-transparent py-3 text-sm font-normal normal-case tracking-normal outline-none"
          />
          {register && (
            <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-[var(--muted-foreground)]">
              Use at least 8 characters with an uppercase letter, lowercase
              letter, and number.
            </span>
          )}
        </label>
        {error && <p className="mt-5 text-sm text-[#b65e6d]">{error}</p>}
        <button
          disabled={busy}
          className="mt-8 w-full bg-[#273d32] py-4 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
        >
          {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setRegister(!register)}
          className="mt-6 w-full text-sm text-[#68816e]"
        >
          {register
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
      <Link
        href="/"
        className="mt-8 block text-center text-xs font-bold uppercase tracking-[0.14em] text-[#68816e]"
      >
        Return home
      </Link>
    </main>
  );
}
