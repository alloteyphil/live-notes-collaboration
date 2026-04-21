export function buildJoinAuthHref(kind: "sign-in" | "sign-up", token: string) {
  const trimmed = token.trim();
  const path = `/join/${encodeURIComponent(trimmed)}`;
  return `/${kind}?redirect_url=${encodeURIComponent(path)}`;
}
