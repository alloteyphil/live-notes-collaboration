import { SignIn } from "@clerk/nextjs";

type PageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

function sanitizeRedirect(path: string | undefined): string | undefined {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return undefined;
  }
  return path;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const redirectUrl = sanitizeRedirect(q.redirect_url);
  const signUpQuery = redirectUrl
    ? `?redirect_url=${encodeURIComponent(redirectUrl)}`
    : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <SignIn
        signUpUrl={`/sign-up${signUpQuery}`}
        fallbackRedirectUrl="/dashboard"
        {...(redirectUrl ? { forceRedirectUrl: redirectUrl } : {})}
      />
    </div>
  );
}
