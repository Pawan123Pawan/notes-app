# Backend refactoring principles

Use this checklist when **refactoring** **`src/trpc/routers/<domain>/`** (`*.router.ts`, `*.service.ts`, `*.input.ts`) or when aligning an existing domain with **[SKILL.md](../SKILL.md)**. Procedure mechanics and layout are in **[trpc-procedures.md](./trpc-procedures.md)**; workspace auth detail is in **[trpc-workspace-auth-middleware.md](./trpc-workspace-auth-middleware.md)**.

**Related:** permission keys → **`src/lib/workspace-access-control.ts`**; frontend callers (loaders, tRPC hooks, forms) → **[frontend refactoring principles](../../frontend/references/refactoring-principles.md)** and **[frontend SKILL — UI and client data](../../frontend/SKILL.md)**.

---

## Compliance pass (required before finishing)

When a task touches or refactors a tRPC domain:

1. **Re-read [SKILL.md](../SKILL.md)** end-to-end — errors in **`*.service.ts`**, bulk mutations, tenancy/middleware bullets, **`AGENTS.md`** cross-cutting rules workers/Drizzle/formatting.
2. **Check authorization** against the sections below. Workspace-scoped procedures must use the **correct middleware** and **`input`** shape (prefer **`workspaceId`** per middleware docs), not only ad hoc slug resolution or **`protectedProcedure`** alone when the convention calls for **`workspaceMembershipMiddleware`** / **`workspacePermissionsMiddleware`**.
3. **If anything fails the checklist**, fix **both sides**: **`src/trpc/routers/<domain>/`** **and** all **frontend usage** (**`loader.ts`**, **`src/app/**`** components that build procedure **`input`**, TanStack **`queryOptions`** / **`mutationOptions`**)—so payloads include **`workspaceId`** where required and nothing still assumes removed fields (e.g. slug-only APIs after migration).

Leaving the router “correct” while clients still send obsolete input is incomplete.

---

## Authorization and permission middleware (when refactoring)

1. **`protectedProcedure`** — session only. Not sufficient by itself when the domain rule is workspace membership or **`hasPermission`**.

2. **Workspace scope** — for org-scoped behavior, **`input`** should include **`workspaceId`** (Better Auth **`organizationId`**) as described in **[trpc-workspace-auth-middleware.md](./trpc-workspace-auth-middleware.md)**. Refactors that still take only **`workspaceSlug`** should **migrate** procedure inputs and callers to **`workspaceId`** when practical (loaders already resolve workspace records and can pass **`workspaceId`**).

3. **`workspaceMembershipMiddleware`** — use when the rule is “**member of this org**” and there is **no** suitable **`hasPermission`** statement. **Do not** stack it before **`workspacePermissionsMiddleware`** (redundant).

4. **`workspacePermissionsMiddleware({ ... })`** — use when the action must match **`auth.api.hasPermission`** for that org. Map resource keys to **`src/lib/workspace-access-control.ts`** (e.g. **`project`**: **`create`**, **`read`**, **`update`**, **`archive`**). Use the **minimal** permission set per procedure (read vs create vs update vs archive).

5. **Router vs service** — keep **`*.router.ts`** thin: **`.use(...)`** middleware for session + workspace gates; **`*.service.ts`** for business rules, DB, and **`TRPCError`** for domain failures. **Avoid** duplicating the same **`hasPermission`** semantics in the service once middleware enforces them; services still enforce **domain** rules (identifiers, ownership of rows within the workspace, illegal state).

6. **Slug-only legacy** — if a refactor keeps slug in **`input`** for compatibility, document why and plan migration; new workspace-scoped procedures should follow **`workspaceId`** + shared middleware patterns.

---

## Structural refactors (reminder)

- **Inline router logic** that outgrows a few lines → **`*.service.ts`** with explicit arguments (**`userId`**, ids from **`input`**, **`headers`** when needed)—see **[trpc-procedures.md — Refactoring procedures](./trpc-procedures.md#refactoring-procedures)**.
- **Non-trivial or reused schemas** → **`*.input.ts`**; avoid large inline **`z.object`** in routers.
- **Duplication** between a procedure and a **loader/script** → single **`*.service.ts`** implementation, call from both.
