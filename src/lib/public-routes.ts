export const publicRoutePatterns = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/join",
  "/join/(.*)",
] as const;

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/join" ||
    pathname.startsWith("/join/")
  );
}
