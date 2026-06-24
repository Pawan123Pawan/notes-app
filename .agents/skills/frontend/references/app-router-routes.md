# App Router routes and workspace chrome

Where authenticated and marketing routes live under **`src/app/`**, and how **`AppShell`** is wired.

See [`../SKILL.md`](../SKILL.md) for **`page.tsx`** composition, **`loader.ts`**, and route **`components/`** placement.

---

## Route groups

- **`src/app/(landing)/`** — marketing and public website content (the landing site).

- **`src/app/(website)/`** — when designing or building pages in this route group, compose UI with shared website primitives from **`src/components/website/components/elements/`** and icons from **`src/components/website/components/icons/`** instead of ad-hoc replacements.

- **`src/app/(login)/`** — sign-up, sign-in, password reset, and other **authorization** flows. Route group only; URLs do not include `(login)`.

- **`src/app/app/`** — the **authenticated product** (`app` is a normal **route segment**, not a parenthesized group). All authenticated routes should live under this path and use URLs that start with **`/app`** (e.g. **`/app`**, **`/app/settings`**).

## `AppShell`

**`AppShell` (`src/app/app/[workspaceSlug]/components/app-shell/app-shell.tsx`)** — sidebar, header, and workspace-level signed-in chrome for URLs under **`/app/[workspaceSlug]/...`**.

- Wire it **only** in **`src/app/app/[workspaceSlug]/layout.tsx`**.
- Do **not** mount **`AppShell`** again in deeper nested layouts (for example under **`project/[projectId]/`**).
- **`/app`** segments that are **not** under a workspace slug (onboarding, accept-invitation, etc.) intentionally stay **without** this shell.
- Do **not** mount **`AppShell`** in **`src/app/layout.tsx`** (the root layout) — landing and auth routes stay unboxed.
