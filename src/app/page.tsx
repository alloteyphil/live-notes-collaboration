"use client";

import { authClient } from "@/lib/auth-client";
import { NavHeader } from "@/components/nav-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  List,
  Paintbrush,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/status-banner";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signUp = async () => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const result = await authClient.signUp.email({
        name: name || "Live Notes User",
        email,
        password,
      });
      if (result.error) {
        setMessage(result.error.message ?? "Sign up failed");
        return;
      }
      setMessage("Account created. You are signed in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const signIn = async () => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      if (result.error) {
        setMessage(result.error.message ?? "Sign in failed");
        return;
      }
      setMessage("Signed in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || (mode === "signup" && !name)) {
      setMessage("Please fill in all required fields.");
      return;
    }
    if (mode === "signup") {
      await signUp();
      return;
    }
    await signIn();
  };

  const signOut = async () => {
    await authClient.signOut();
    setMessage("Signed out.");
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader
        isSignedIn={Boolean(session)}
        sessionPending={isPending}
        userEmail={session?.user.email}
        onSignOut={signOut}
      />
      <main>
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-success" />
                    Real-time collaboration
                  </div>
                  <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Notes that work together
                  </h1>
                  <p className="text-pretty text-lg text-muted-foreground">
                    Create workspaces, collaborate in real-time, and keep your team aligned. Live
                    Notes brings your ideas together with autosave, presence, and powerful
                    permissions.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FeatureItem icon={Users} text="Workspace roles & permissions" />
                  <FeatureItem icon={Save} text="Autosave with conflict resolution" />
                  <FeatureItem icon={Paintbrush} text="Collaborative whiteboard" />
                  <FeatureItem icon={Shield} text="Invite-based access control" />
                </div>
                {session ? (
                  <div className="flex items-center gap-3">
                    <Button size="lg" asChild>
                      <Link href="/dashboard">
                        Open Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={signOut}>
                      Sign out
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="lg:pl-8">
                {isPending ? (
                  <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                    <div className="space-y-6">
                      <div className="space-y-2 text-center">
                        <div className="mx-auto h-7 w-40 animate-pulse rounded bg-muted" />
                        <div className="mx-auto h-4 w-56 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-16 animate-pulse rounded-md bg-muted" />
                        <div className="h-16 animate-pulse rounded-md bg-muted" />
                        <div className="h-11 animate-pulse rounded-md bg-muted" />
                      </div>
                    </div>
                  </div>
                ) : session ? (
                  <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                    <div className="flex flex-col items-center space-y-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <Check className="h-8 w-8 text-success" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-card-foreground">
                          {"You're signed in"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Signed in as{" "}
                          <span className="font-medium text-foreground">{session.user.email}</span>
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-3">
                        <Button size="lg" className="w-full" asChild>
                          <Link href="/dashboard">
                            Open Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full" onClick={signOut}>
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                    <div className="space-y-6">
                      <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                          {mode === "signin" ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {mode === "signin"
                            ? "Sign in to access your workspaces"
                            : "Get started with Live Notes today"}
                        </p>
                      </div>
                      <form onSubmit={onSubmit} className="space-y-4">
                        {mode === "signup" ? (
                          <div className="space-y-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                              placeholder="Jane Doe"
                              disabled={isSubmitting}
                            />
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            disabled={isSubmitting}
                          />
                        </div>
                        <Button className="w-full" size="lg" disabled={isSubmitting} type="submit">
                          {mode === "signin" ? "Sign in" : "Create account"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {mode === "signin"
                            ? "Don't have an account?"
                            : "Already have an account?"}
                          <button
                            type="button"
                            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                            className="ml-1 font-medium text-primary hover:underline"
                          >
                            {mode === "signin" ? "Sign up" : "Sign in"}
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-12 space-y-4 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Built for teams
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Everything you need to collaborate effectively, from workspaces to real-time
                presence.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <CapabilityCard
                icon={Users}
                title="Workspace Roles"
                description="Owner, Editor, and Viewer roles with granular permissions for each workspace."
              />
              <CapabilityCard
                icon={Save}
                title="Autosave Editor"
                description="Never lose your work. Changes are saved automatically with offline support."
              />
              <CapabilityCard
                icon={List}
                title="Paginated Lists"
                description="Efficiently browse large workspaces and note collections with smart pagination."
              />
              <CapabilityCard
                icon={FileText}
                title="Rich Notes"
                description="Create and edit notes with your team, seeing who's typing in real-time."
              />
              <CapabilityCard
                icon={Paintbrush}
                title="Whiteboard"
                description="Sketch ideas together on a collaborative canvas with live sync."
              />
              <CapabilityCard
                icon={Shield}
                title="Invite System"
                description="Invite teammates by email with specific roles. Manage pending and accepted invites."
              />
            </div>
            {isPending ? (
              <div className="mt-8">
                <StatusBanner variant="muted" message="Loading session..." />
              </div>
            ) : null}
            {message ? (
              <div className="mt-8">
                <StatusBanner
                  variant={
                    message.toLowerCase().includes("failed")
                      ? "error"
                      : message.toLowerCase().includes("signed out")
                        ? "muted"
                        : "success"
                  }
                  message={message}
                />
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Live Notes</span>
            </div>
            <p className="text-sm text-muted-foreground">Collaborative notes for modern teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-accent/30">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
