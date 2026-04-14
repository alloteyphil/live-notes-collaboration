import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const { handler } = convexBetterAuthNextJs({
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
});

export const { GET, POST } = handler;
