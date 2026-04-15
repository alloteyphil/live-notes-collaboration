# UI Design System

Last updated: 2026-04-15

## Purpose

This document defines the UI consistency rules for Live Notes. Use these rules for new pages and refactors to keep the product visually coherent.

## Foundations

- **Color system**: neutral-first UI with semantic accents for success, warning, and error.
- **Typography**: Geist sans for all UI text; semibold for section/page titles.
- **Spacing rhythm**: use 2/3/4/6 spacing steps for component internals; keep page sections separated by consistent vertical gaps.
- **Surface model**: app background + bordered white cards (`Card`) for functional sections.
- **Focus behavior**: every interactive control must show a visible focus ring.

## Layout Rules

- Use `app-container` for all primary route content containers.
- Use `PageHeader` at the top of app screens (`/dashboard`, `/workspace/[id]`, `/note/[id]`).
- Prefer 2-3 primary cards per page rather than deeply nested surfaces.
- Keep action clusters aligned with section headers or card footers.

## Component Rules

- Use shared primitives from `src/components/ui`:
  - `Button`, `Input`, `Textarea`, `Card`, `Badge`
  - `Label`, `Separator`, `Skeleton`, `EmptyState`, `StateMessage`, `PageHeader`
- Do not recreate base control styles with one-off Tailwind class strings when a shared primitive exists.
- Use `Button` variants consistently:
  - `primary` for the dominant action in a section
  - `secondary` for neutral supportive actions
  - `danger` for destructive actions only
  - `ghost` for low-emphasis navigation/action links

## Icon Rules

- Use a single icon family: `lucide-react`.
- Prefer icons via `src/components/ui/icons.tsx` mapping.
- Standard icon sizing:
  - `16px` (`h-4 w-4`) for inline actions and buttons
  - `20px` (`h-5 w-5`) for empty-state illustration markers
- Pair icons with text for clarity. Avoid icon-only controls unless necessary; when icon-only, always add `aria-label`.

## State Surface Rules

- **Loading**: use `Skeleton`, not raw "Loading..." text for major sections.
- **Empty**: use `EmptyState` with title, description, and clear CTA when possible.
- **Error/Warning/Success**: use `StateMessage` for inline status and toasts for transient feedback.
- **Pagination status**: show explicit loading-more and exhausted states.

## Accessibility Rules

- Keep color contrast high for body text and action labels.
- Preserve keyboard reachability for all actions and form fields.
- Keep meaningful labels on form inputs (`Label` + `id` pairing).
- Use sentence case for actionable copy and avoid ambiguous button labels.

## Do / Don’t

- **Do**: compose pages from shared components and semantic status states.
- **Do**: keep spacing and typography aligned to existing screens.
- **Don’t**: mix multiple icon libraries.
- **Don’t**: introduce custom control styling before checking existing primitives.
