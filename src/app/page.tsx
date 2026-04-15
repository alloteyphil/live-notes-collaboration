"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const inputClassName =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-fuchsia-300 transition focus:ring-2";

  const signUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });
    if (result.error) {
      setMessage(result.error.message ?? "Sign up failed");
      return;
    }
    setMessage("Account created. You are signed in.");
  };

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await authClient.signIn.email({
      email,
      password,
    });
    if (result.error) {
      setMessage(result.error.message ?? "Sign in failed");
      return;
    }
    setMessage("Signed in.");
  };

  const signOut = async () => {
    await authClient.signOut();
    setMessage("Signed out.");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-fuchsia-50 via-white to-cyan-50 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-fuchsia-200 bg-white/70 px-3 py-1 text-xs font-semibold text-fuchsia-700">
              Live Notes • Better Auth • Convex • Next.js
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              A lively starting point for your realtime notes app.
            </h1>
            <p className="max-w-xl text-base text-zinc-600">
              This homepage is designed as a reference: playful gradients, soft surfaces, strong
              CTAs, and clear product storytelling you can reuse across dashboard and editor pages.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-700"
              >
                Explore dashboard
              </Link>
              <span className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600">
                Tailwind v4 design baseline
              </span>
            </div>
            <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              <div className="rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm">Realtime-ready UX</div>
              <div className="rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm">Clean auth flow</div>
              <div className="rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm">CV-friendly visuals</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-fuchsia-100 backdrop-blur">
            <p className="mb-4 text-sm font-medium text-zinc-600">Quick preview card</p>
            <div className="space-y-3">
              <div className="rounded-xl bg-zinc-900 p-4 text-white">
                <p className="text-xs text-zinc-300">Current stack</p>
                <p className="mt-1 text-sm font-medium">Next.js + Convex + Better Auth + Tailwind</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs text-zinc-500">Features</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-800">Workspaces</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs text-zinc-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">Ready to build</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isPending ? <p className="text-sm text-zinc-600">Loading session...</p> : null}

        {!isPending && session ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-zinc-500">Signed in as</p>
                <p className="font-semibold text-zinc-900">{session.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                  href="/dashboard"
                >
                  Open dashboard
                </Link>
                <button
                  onClick={signOut}
                  type="button"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2">
            <form
              onSubmit={signUp}
              className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-zinc-900">Create account</h2>
              <p className="text-sm text-zinc-500">Start your first workspace and invite collaborators.</p>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className={inputClassName}
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className={inputClassName}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                className={inputClassName}
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                Sign up
              </button>
            </form>

            <form
              onSubmit={signIn}
              className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-zinc-900">Sign in</h2>
              <p className="text-sm text-zinc-500">Welcome back. Continue building your product.</p>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className={inputClassName}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                className={inputClassName}
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-linear-to-r from-fuchsia-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Sign in
              </button>
            </form>
          </section>
        )}

        {message ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 shadow-sm">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
