"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StateMessage } from "@/components/ui/state-message";
import Link from "next/link";
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
    <main className="app-container space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <PageHeader
          description="Collaborative note-taking with realtime presence, autosave, and workspace permissions."
          title="Live Notes"
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">Core collaboration features are running in production-ready shape.</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                <Icons.users className="h-3.5 w-3.5" />
                Workspace roles
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                <Icons.note className="h-3.5 w-3.5" />
                Autosave editor
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                <Icons.folder className="h-3.5 w-3.5" />
                Paginated lists
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {isPending ? <p className="text-sm text-zinc-600">Loading session...</p> : null}

      {!isPending && session ? (
        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-zinc-500">Signed in as</p>
              <p className="font-semibold text-zinc-900">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link href="/dashboard">
                  Open dashboard
                  <Icons.forward />
                </Link>
              </Button>
              <Button onClick={signOut} variant="secondary">
                <Icons.logout />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Start your first workspace and invite collaborators.</p>
              <form className="space-y-3" onSubmit={signUp}>
                <Input
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name"
                  value={name}
                />
                <Input
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                  value={email}
                />
                <Input
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  value={password}
                />
                <Button className="w-full" type="submit">
                  <Icons.plus />
                  Sign up
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Welcome back. Continue where you left off.</p>
              <form className="space-y-3" onSubmit={signIn}>
                <Input
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                  value={email}
                />
                <Input
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  value={password}
                />
                <Button className="w-full" type="submit">
                  <Icons.forward />
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {message ? (
        <StateMessage
          variant={
            message.toLowerCase().includes("failed")
              ? "error"
              : message.toLowerCase().includes("signed out")
                ? "muted"
                : "success"
          }
        >
          {message}
        </StateMessage>
      ) : null}
    </main>
  );
}
