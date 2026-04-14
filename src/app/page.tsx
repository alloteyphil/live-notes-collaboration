"use client";

import { authClient } from "@/lib/auth-client";
import { FormEvent, useState } from "react";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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
    <main className="mx-auto mt-10 w-full max-w-2xl space-y-6 px-4">
      <h1 className="text-3xl font-semibold tracking-tight">Live Notes Starter</h1>
      <p className="text-sm text-zinc-600">
        Better Auth + Convex are wired. Next step is notes features.
      </p>

      {isPending ? <p className="text-sm text-zinc-600">Loading session...</p> : null}
      {!isPending && session ? (
        <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
          <p>
            Signed in as <strong className="font-medium">{session.user.email}</strong>
          </p>
          <button
            onClick={signOut}
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={signUp} className="grid gap-2 rounded-lg border border-zinc-200 p-4">
            <h2 className="text-lg font-medium">Create account</h2>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign up
            </button>
          </form>

          <form onSubmit={signIn} className="grid gap-2 rounded-lg border border-zinc-200 p-4">
            <h2 className="text-lg font-medium">Sign in</h2>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign in
            </button>
          </form>
        </div>
      )}

      {message ? <p className="rounded-md bg-zinc-100 p-3 text-sm">{message}</p> : null}
      <p className="text-sm text-zinc-600">
        Run <code>npx convex dev</code> to push Convex auth and schema changes.
      </p>
    </main>
  );
}
