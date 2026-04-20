"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConvexAuth } from "convex/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { NavHeader } from "@/components/nav-header";
import { ContentCard } from "@/components/content-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStoredTheme, setStoredTheme, type ThemePreference } from "@/lib/theme-storage";
import {
  getFontScale,
  getMotionPreference,
  getUiDensity,
  setFontScale,
  setMotionPreference,
  setUiDensity,
  type FontScale,
  type MotionPreference,
  type UiDensity,
} from "@/lib/ui-preferences";
import { Palette, Sparkles, Type, User } from "lucide-react";

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const isPending = !isLoaded;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const session = useMemo(
    () => (isSignedIn ? { user: { email: userEmail } } : null),
    [isSignedIn, userEmail],
  );
  const sessionPending = isPending || (Boolean(session) && isConvexAuthLoading);

  const [theme, setTheme] = useState<ThemePreference>("system");
  const [fontScale, setFontScaleState] = useState<FontScale>("md");
  const [uiDensity, setUiDensityState] = useState<UiDensity>("comfortable");
  const [motion, setMotionState] = useState<MotionPreference>("system");

  useEffect(() => {
    queueMicrotask(() => {
      setTheme(getStoredTheme());
      setFontScaleState(getFontScale());
      setUiDensityState(getUiDensity());
      setMotionState(getMotionPreference());
    });
  }, []);

  const onThemeChange = useCallback((value: ThemePreference) => {
    setTheme(value);
    setStoredTheme(value);
  }, []);

  const onFontScaleChange = useCallback((value: FontScale) => {
    setFontScaleState(value);
    setFontScale(value);
  }, []);

  const onUiDensityChange = useCallback((value: UiDensity) => {
    setUiDensityState(value);
    setUiDensity(value);
  }, []);

  const onMotionChange = useCallback((value: MotionPreference) => {
    setMotionState(value);
    setMotionPreference(value);
  }, []);

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Account";

  return (
    <div className="min-h-screen bg-background">
      <NavHeader
        isSignedIn={Boolean(session)}
        sessionPending={sessionPending}
        userEmail={session?.user.email}
        onSignOut={async () => {
          await signOut({ redirectUrl: "/" });
        }}
      />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
        <PageHeader
          title="Settings"
          description="Account and appearance for PulseNotes."
          backHref="/dashboard"
          backLabel="Dashboard"
        />

        {!session && !sessionPending ? (
          <ContentCard className="mt-8">
            <EmptyState
              title="Sign in required"
              description="Open settings after you sign in."
              action={
                <Button asChild>
                  <Link href="/sign-in?redirect_url=/settings">Sign in</Link>
                </Button>
              }
            />
          </ContentCard>
        ) : sessionPending ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <ContentCard
              title="Account"
              description="Your profile is managed with Clerk."
              className="shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{displayName}</p>
                    <p className="truncate text-sm text-muted-foreground">{userEmail || "No email"}</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => openUserProfile()}>
                  <User className="mr-2 h-4 w-4" />
                  Manage account
                </Button>
              </div>
              {!isConvexAuthenticated && session ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Connecting to collaboration backend…
                </p>
              ) : null}
            </ContentCard>

            <ContentCard
              title="Appearance"
              description="These options apply on this device only."
              className="shadow-sm"
            >
              <div className="grid max-w-md gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="theme-select" className="flex items-center gap-2 text-sm">
                    <Palette className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Color mode
                  </Label>
                  <Select value={theme} onValueChange={(v) => onThemeChange(v as ThemePreference)}>
                    <SelectTrigger id="theme-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="font-scale-select" className="flex items-center gap-2 text-sm">
                    <Type className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Text size
                  </Label>
                  <Select value={fontScale} onValueChange={(v) => onFontScaleChange(v as FontScale)}>
                    <SelectTrigger id="font-scale-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="density-select" className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Density
                  </Label>
                  <Select value={uiDensity} onValueChange={(v) => onUiDensityChange(v as UiDensity)}>
                    <SelectTrigger id="density-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="motion-select" className="text-sm">
                    Motion
                  </Label>
                  <Select value={motion} onValueChange={(v) => onMotionChange(v as MotionPreference)}>
                    <SelectTrigger id="motion-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Match system</SelectItem>
                      <SelectItem value="reduce">Reduce animations</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    When set to match system, PulseNotes follows your device’s reduced-motion
                    setting.
                  </p>
                </div>
              </div>
            </ContentCard>
          </div>
        )}
      </main>
    </div>
  );
}
