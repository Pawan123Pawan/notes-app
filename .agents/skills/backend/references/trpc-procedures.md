# tRPC procedures and refactoring (this repo)

Load generic tRPC mechanics from **`AGENTS.md`** intent mappings (`node_modules/@trpc/server/skills/trpc-router/SKILL.md`, `server-setup`, `adapter-fetch`). This reference only captures **prodios-forge** layout and policy.

## File layout (`src/trpc/routers/`)

Per **domain** (issues, workspaces, settings, …), use a **subdirectory** named for the domain, for example **`issues/issues.router.ts`**, **`issues/issues.service.ts`**, **`issues/issues.input.ts`**. **Cross-domain imports** use paths like **`../projects/projects.input`** or **`../workspaces/workspaces.service`** from sibling folders.

| File (inside `src/trpc/routers/<domain>/`) | Responsibility |
|------|------------------|
| **`*.router.ts`** | Defines `createTRPCRouter({ ... })`, wires **queries/mutations**, imports schemas and service functions. Keep procedures **thin**. |
| **`*.service.ts`** | **Business logic and data access** reused by procedures and other **server-only** callers. No procedure builders here. |
| **`*.input.ts`** | **Zod** (or shared) **input schemas** exported for router **`.input(...)`** and, when needed, **client** validation. |

Register each router on the app router in **`src/trpc/routers/_app.ts`** (root of `routers/`, alongside the domain folders).

Procedure helpers live in **`src/trpc/init.ts`** (for example **`protectedProcedure`** enforces signed-in **`ctx.user`**). Use **`protectedProcedure`** unless the procedure is intentionally public and **`baseProcedure`** is correct. Workspace-scoped auth middleware (`workspaceMembershipMiddleware`, `workspacePermissionsMiddleware`) and **`workspaceId`** input conventions are described in **[trpc-workspace-auth-middleware.md](./trpc-workspace-auth-middleware.md)**.

## Creating procedures

1. **Choose query vs mutation** — reads vs writes; prefer queries for idempotent reads.
2. **Input** — add or extend **`*.input.ts`** with a named schema; use **`.input(schema)`** on the procedure.
3. **Implementation** — call **`*.service.ts`** functions from the procedure handler **`async ({ ctx, input }) => ...`** (omit **`input`** if none).
4. **Authorization and tenancy** — for workspace-scoped procedures, prefer **`workspaceId`** in **`input`** plus **`workspaceMembershipMiddleware`** and/or **`workspacePermissionsMiddleware`** per **[trpc-workspace-auth-middleware.md](./trpc-workspace-auth-middleware.md)**. Otherwise enforce rules **in the procedure or service** and use **`TRPCError`** with **`NOT_FOUND`**, **`FORBIDDEN`**, or **`UNAUTHORIZED`** as appropriate.
5. **Errors** — use **`TRPCError`** from **`@trpc/server`** with stable **`code`** and a clear **`message`** for clients. In **`*.service.ts`**, prefer **throwing** **`TRPCError`** for expected domain failures instead of returning **`{ ok: false }`** / reason enums; the procedure can **`await`** the service and let errors propagate.

## Refactoring procedures

- **Inline handler logic** growing beyond a few lines → move to **`*.service.ts`** and unit-shaped functions with explicit arguments (pass **`ctx.user.id`**, **`ctx.headers`**, ids from **`input`**, not raw **`ctx`** objects unless already project convention).
- **Duplicated validation** or schemas referenced from client and server → **`*.input.ts`**.
- **Large `*.router.ts`** → split by subdomain only if one exported router per file still holds (prefer **multiple routers merged** in **`_app.ts`** only when domains are truly separate).
- **Inline `.input(z.object({...}))`** in the router → extract to **`*.input.ts`** when the schema is non-trivial or reused.
- **Duplicated query/mutation logic** between a procedure and a script/RSC loader → single implementation in **`*.service.ts`**, call from both.

## API surface policy

- **tRPC-first:** expose behavior through **typed procedures** and consume via the **tRPC client** / TanStack integration—not new **Next.js `src/app/**/api/**` handlers** for ordinary JSON RPC-style APIs.
- **Exception:** use **route handlers** for **non-JSON** needs (e.g. **multipart / file uploads**). Keep tRPC payloads **JSON-serializable**.

## Background work

Prefer **BullMQ** (see the **Background workers** section in **AGENTS.md**) for work that should **retry**, run **long**, or **survive restarts**. Avoid doing that inline in a procedure unless it is **trivial and synchronous**.

## Related product rules

Features touching **projects / issues / notifications** must align with **`docs/project-management-workflow.md`** when behavior overlaps that domain.

## Schema / DB migrations

Do **not** edit or generate migration files in agent flows; follow **`AGENTS.md`** Drizzle workflow—prompt the user to run commands locally.
