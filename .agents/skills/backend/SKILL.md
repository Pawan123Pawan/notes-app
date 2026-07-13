---
name: backend
description: Applies prodios-forge server and backend conventions—starting with tRPC routers, procedures, services, and inputs—and will extend to additional backend domains via references. Use when adding or refactoring tRPC APIs, server-only modules, or other backend behavior documented here or under backend/references/.
disable-model-invocation: false
---

# Backend (prodios-forge)

Central place for **server-side** conventions beyond generic framework docs. Repo-wide guardrails still live in **`AGENTS.md`** (for example formatting and Drizzle workflow); backend-specific tRPC and worker conventions are maintained here.

## When touching tRPC

Read **[references/trpc-procedures.md](references/trpc-procedures.md)** for domain file layout: each domain lives under **`src/trpc/routers/<domain>/`** with **`*.router.ts`**, **`*.service.ts`**, and **`*.input.ts`**, plus **creating procedures**, **refactoring procedures**, tRPC-first vs Next route handlers, and related notes. The app root **`src/trpc/routers/_app.ts`** merges domain routers.

### Router structure quick rule

When adding or refactoring procedures and routers, follow this skill and **[references/trpc-procedures.md](references/trpc-procedures.md)** as the source of truth for this repository's domain layout, shared inputs, and tRPC-first API policy.

### Errors in **`*.service.ts`**

For **expected** domain failures (validation, tenancy, missing rows, illegal state), **`*.service.ts`** should **`throw new TRPCError({ code, message })`** from **`@trpc/server`** with a stable **`code`** and a client-safe **`message`**—not return **`{ ok: false, reason: ... }`** or similar result unions. That keeps **`*.router.ts`** thin (**`await someService(...)`** with no branching on error-shaped return values) and matches existing services such as **`workspaces/workspaces.service.ts`**. Procedures may still throw **`TRPCError`** directly when the logic lives only in the router layer.

### Assertion helpers — avoid boolean-then-assert microfunctions

In **`*.service.ts`**, do **not** split a check into (1) a **`hasX`** / **`checkX`** function that returns **`boolean`** or a row and (2) a separate **`assertX`** that **only** calls that helper and throws. Prefer **one** **`async`** (or sync) helper that performs the lookup and **`throw`**s **`TRPCError`** inline when the invariant fails.

Reserve separate **boolean-returning** helpers for cases where another path **actually** branches on **`true`/`false`** without throwing (multiple callers need the same predicate differently).

<details>
<summary>Example — avoid versus prefer</summary>

```typescript
// Avoid: trivial boolean wrapper used only by a single assert
async function identifierTaken(input: WorkspaceIdentifierInput): Promise<boolean> {
  const row = await db.query.project.findFirst({ where: /* ... */ })
  return row != null && row.id !== input.excludeProjectId
}

async function assertIdentifierAvailable(input: WorkspaceIdentifierInput) {
  if (await identifierTaken(input)) {
    throw new TRPCError({ code: 'CONFLICT', message: '…' })
  }
}

// Prefer: one function with the query and throw colocated
async function assertIdentifierAvailable(input: WorkspaceIdentifierInput) {
  const row = await db.query.project.findFirst({ where: /* ... */ })
  if (row != null && row.id !== input.excludeProjectId) {
    throw new TRPCError({ code: 'CONFLICT', message: '…' })
  }
}
```

</details>

For **session**, **workspace tenancy**, and **Better Auth permissions** on tRPC procedures, read **[references/trpc-workspace-auth-middleware.md](references/trpc-workspace-auth-middleware.md)**. In short: use **`protectedProcedure`** for signed-in users; include **`workspaceId`** in **`input`** for workspace-scoped APIs; use **`workspaceMembershipMiddleware`** when you only need to ensure the user is an org **member** (no matching **`hasPermission`** gate). Use **`workspacePermissionsMiddleware({ ... })`** when the action is gated by **`auth.api.hasPermission`**—that check is evaluated in organization context and **implies membership**, so **do not** chain **`workspaceMembershipMiddleware`** before it (redundant).

### Refactoring principles (routers and services)

When **refactoring** a **`*.router.ts`** or **`*.service.ts`**, follow **[references/refactoring-principles.md](references/refactoring-principles.md)**. Treat **authorization** as part of that refactor: use the **appropriate workspace middleware** and **`workspaceId`**-based **`input`** where the tenancy doc applies—not only **`protectedProcedure`** plus hidden membership checks in the service—and align procedure inputs with **`src/lib/workspace-access-control.ts`** (**`workspacePermissionsMiddleware`**) instead of enforcing “every member passes” implicitly in **`*.service.ts`** when **`hasPermission`** should gate the action.

### Compliance check against this skill

Before finishing any task that **adds** or **refactors** backend tRPC code, **verify the change against every section of this SKILL.md** (tRPC layout, **`TRPCError`** in **`*.service.ts`**, assertion-helper pattern, tenancy/middleware, bulk actions, linked **`references/*`** docs). **If anything is out of conformance**, refactor to match—including **frontend** callers under **`src/app/**`** (**`loader.ts`**, forms, **`trpc.*.queryOptions` / `mutationOptions`**) so **procedure inputs**, cache keys, and invalidation filters stay consistent with the updated API. Leaving updated routers paired with stale client payloads is insufficient.

## Bulk actions from the client

When a UI control applies the **same operation** to **many** selected rows (or many recipients), expose **one** tRPC **mutation** whose input includes the **batch** (e.g. `{ workspaceId, invitations: [...] }`). Implement iteration, deduplication, and error handling in **`*.service.ts`** (and/or shared helpers), not **`Promise.all`** of separate Better Auth / HTTP calls from React for a **single** user gesture. This keeps **one client round-trip**, centralizes caps and validation (see **`bulkInviteWorkspaceMembers`** and **`bulkResendWorkspaceInvitationEmails`** under **`src/trpc/routers/workspaces/`**), and matches the frontend skill’s bulk-mutation rule.

## Background workers and message queues (BullMQ)

- **When to use queues:** For **asynchronous processing** that should not block request/response flow, especially work that may fail and need retries, run for a long time, or survive process restarts (emails, webhook fan-out, file post-processing, notifications, imports). Prefer enqueueing over fire-and-forget `void somePromise()` or inline heavy work in tRPC procedures/route handlers unless the task is trivial and synchronous.
- **Layout:** For each domain (for example `email`), colocate queue and worker under `src/worker/<domain>/`:
  - **`src/worker/<domain>/<domain>.queue.ts`** defines the queue name and payload type, and exports the queue created with **`createQueue`** from **`@/lib/worker`** (shared Redis from **`@/lib/redis`**).
  - **`src/worker/<domain>/<domain>.worker.ts`** exports a worker factory (for example `createEmailWorker`) using **`createWorker`** from **`@/lib/worker`** with the **same queue name**.
- **Entrypoint:** Register/start workers in **`src/worker/index.ts`** (include in the `workers` array and keep graceful shutdown closing all workers). Run consumers with **`bun run worker`**.
- **Producers:** In Next.js app code and scripts, import queues from **`@/worker/<domain>/<domain>.queue`** and call **`queue.add(...)`**. Keep payloads JSON-serializable; render React Email to HTML before enqueueing when downstream APIs require strings.
- **Naming:** Export a stable queue name constant from `*.queue.ts` (for example `emailQueueName`) and import it in the paired `*.worker.ts` so producers and consumers always target the same queue.

## Additional references

- **[references/mongoose-mongodb.md](references/mongoose-mongodb.md)** — MongoDB + Mongoose only; single `connectDB()`; Better Auth via `@/db`; not Prisma/Postgres.
- **[references/refactoring-principles.md](references/refactoring-principles.md)** — refactors (auth middleware, **`workspaceId`**, checklist against this skill + frontend callers).

Add new topical files under **`references/`** as backend scope grows (e.g. workers, auth callbacks, webhooks). Link them from this section.
