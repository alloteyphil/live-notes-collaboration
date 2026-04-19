"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { NavHeader } from "@/components/nav-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  List,
  LogIn,
  Paintbrush,
  Save,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { StatusBanner } from "@/components/status-banner";

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isPending = !isLoaded;
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const onSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader
        isSignedIn={Boolean(isSignedIn)}
        sessionPending={isPending}
        userEmail={userEmail}
        onSignOut={onSignOut}
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
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <Button size="lg" asChild>
                      <Link href="/dashboard">
                        Open Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={onSignOut}>
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
                ) : isSignedIn ? (
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
                          <span className="font-medium text-foreground">{userEmail}</span>
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-3">
                        <Button size="lg" className="w-full" asChild>
                          <Link href="/dashboard">
                            Open Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full" onClick={onSignOut}>
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
                          Get started
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Create an account or sign in to open your workspaces.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button size="lg" className="w-full" asChild>
                          <Link href="/sign-up">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create account
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="w-full" asChild>
                          <Link href="/sign-in">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                          </Link>
                        </Button>
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        Authentication is handled securely by Clerk.
                      </p>
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
