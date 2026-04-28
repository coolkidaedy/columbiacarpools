"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function DevLoginClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("dev-email-signin", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/",
      });
      if (!res?.ok || res.error) {
        setError("That email isn’t allowed. It must match DEV_SIGNIN_EMAIL in your server .env.");
        return;
      }
      window.location.href = res.url ?? "/";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#F7F4EF] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="font-serif text-xl font-semibold text-[#1a1a1a]">Dev sign-in</h1>
        <p className="mt-1 text-[13px] text-[#888]">
          Enter the email configured as <code className="text-[12px]">DEV_SIGNIN_EMAIL</code>. No password—only for
          local/testing.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label htmlFor="dev-email" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#888]">
              Email
            </label>
            <input
              id="dev-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[13px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#4A7FD4]/40"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-[#F7F4EF] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-[#aaa]">
          <Link href="/login" className="text-[#4A7FD4] underline-offset-2 hover:underline">
            Back to student login
          </Link>
        </p>
      </div>
    </div>
  );
}
