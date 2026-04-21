# Workspace invites

## In-app invites

Owners invite members by email from **Workspace → Members**. Pending invites appear for the recipient on the **Dashboard** and are auto-claimed when they sign in with a matching primary email (same flow as before).

## Shareable invite links

Each new pending invite stores a secret `claimToken` in Convex. Owners can **Copy link** on **Workspace → Invites** for any pending invite that has a token.

- Link shape: `{origin}/join/{claimToken}`.
- `origin` should be your deployed app URL. Set **`NEXT_PUBLIC_APP_URL`** in Next.js (e.g. `https://pulse-notes.vercel.app/`) so copied links stay correct behind proxies or non-default hosts. If unset, the UI falls back to `window.location.origin` in the browser.
- The recipient must **sign in with the same email** as the invite; the join page calls `workspaces.claimInviteByToken` after authentication.

### Sign-in redirect

`/sign-in` and `/sign-up` accept an optional query parameter `redirect_url` (must be a same-origin path starting with `/`). The Clerk `<SignIn />` / `<SignUp />` components use `forceRedirectUrl` when this parameter is present so users return to `/join/...` after authentication.

## Optional outbound email (not implemented in-repo)

To email invites automatically, add a Convex **action** (Node runtime) that:

1. Runs after `workspaces.inviteMember` (e.g. via internal mutation + scheduler, or by invoking the action from your API route).
2. Calls a provider such as [Resend](https://resend.com) using an API key stored in Convex env (e.g. `RESEND_API_KEY`).
3. Sends a message that includes the same `/join/{claimToken}` URL.

Keep the in-app + link flows as a fallback when email is misconfigured or lands in spam.
