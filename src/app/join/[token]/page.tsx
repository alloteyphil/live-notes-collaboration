"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { ContentCard } from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/role-badge";
import { buildJoinAuthHref } from "@/lib/invite-links";

export default function JoinInvitePage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const preview = useQuery(
    api.workspaces.getInvitePreviewByToken,
    token.trim() ? { token: token.trim() } : "skip",
  );
  const claimInviteByToken = useMutation(api.workspaces.claimInviteByToken);

  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const signInHref = useMemo(() => {
    return buildJoinAuthHref("sign-in", token);
  }, [token]);

  const signUpHref = useMemo(() => {
    return buildJoinAuthHref("sign-up", token);
  }, [token]);

  const onAccept = useCallback(async () => {
    setError(null);
    setIsClaiming(true);
    try {
      const result = await claimInviteByToken({ token: token.trim() });
      router.replace(`/workspace/${result.workspaceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invite.");
    } finally {
      setIsClaiming(false);
    }
  }, [claimInviteByToken, router, token]);

  const canClaim =
    isLoaded &&
    isSignedIn &&
    isAuthenticated &&
    !isConvexAuthLoading &&
    preview !== null &&
    preview !== undefined;

  if (!token.trim()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <ContentCard title="Invalid link" description="This invite URL is missing a token.">
          <p className="text-sm text-muted-foreground">Ask the workspace owner for a new invite link.</p>
        </ContentCard>
      </div>
    );
  }

  if (preview === undefined) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <ContentCard title="Checking invite…" description="One moment.">
          <p className="text-sm text-muted-foreground">Loading invite details.</p>
        </ContentCard>
      </div>
    );
  }

  if (preview === null) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <ContentCard
          title="Invite not found"
          description="This link may have expired, been revoked, or already used."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">You can still open workspaces you already belong to.</p>
        </ContentCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <ContentCard
        title={`Join ${preview.workspaceName}`}
        description={`You were invited for ${preview.invitedEmail}. Use the same email on your account to accept.`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Role:</span>
            <RoleBadge role={preview.role} showIcon={false} />
          </div>
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !isSignedIn ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href={signInHref}>Sign in to accept</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={signUpHref}>Create account</Link>
              </Button>
            </div>
          ) : !isAuthenticated || isConvexAuthLoading ? (
            <p className="text-sm text-muted-foreground">Connecting to your workspace…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {user?.primaryEmailAddress?.emailAddress ?? "your account"}
                </span>
                .
              </p>
              {error ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void onAccept()} disabled={isClaiming || !canClaim}>
                  {isClaiming ? "Joining…" : "Accept invite"}
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </ContentCard>
    </div>
  );
}
