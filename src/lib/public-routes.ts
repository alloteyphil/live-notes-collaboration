export const publicRoutePatterns = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/join(.*)",
] as const;

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/join")
  );
}
