# tRPC workspace auth and middleware (this repo)

Implementation lives in **`src/trpc/init.ts`**. Use these building blocks for procedures that are scoped to a Better Auth **organization** (workspace).

## Session: `protectedProcedure` vs `baseProcedure`

- **`protectedProcedure`** — requires a signed-in user (`ctx.user` after the guard). Use for almost all app procedures.
- **`baseProcedure`** — no session requirement. Reserve for intentionally public procedures.

Workspace middleware assumes a user id exists; always chain **`protectedProcedure`** (or an equivalent auth middleware) **before** workspace middleware.

## Input: `workspaceId`

Workspace-scoped procedures must accept **`workspaceId`** in the procedure **`input`** (Zod schema: non-empty string). It is the same value as Better Auth **`organizationId`**.

- Define or extend schemas in **`*.input.ts`** with `workspaceId` (see existing patterns under `src/trpc/routers/workspaces/`).
- Prefer passing **`workspaceId`** from **server loaders / trusted context** on the client, not inferring it only from URL slugs on the server without a membership or permission check.

The workspace middleware helpers resolve `workspaceId` from **parsed `input` first**, then from **raw input**, and throw **`BAD_REQUEST`** if it is missing or invalid.

## `workspaceMembershipMiddleware` (constant)

- **What it does:** Ensures the current user has a **member** row for that organization (DB check via `assertUserMemberOfWorkspace`).
- **When to use:** Any workspace-scoped behavior that should be limited to **members** of that workspace, including reads where Better Auth’s default statements do not expose a fitting `hasPermission` action.
- **Errors:** **`NOT_FOUND`** (“Workspace not found.”) if the user is not a member (same semantics as hiding non-membership).

```ts
protectedProcedure
  .input(yourSchemaWithWorkspaceId)
  .use(workspaceMembershipMiddleware)
  .query(({ input }) => {
    /* ... */
  })
```

## `workspacePermissionsMiddleware(permissions)` (factory)

- **What it does:** Calls **`auth.api.hasPermission`** with `organizationId: workspaceId` from input and the given **`permissions`** object.
- **When to use:** Actions gated by **Better Auth access control** (invitations, org administration, product permissions declared in **`src/lib/workspace-access-control.ts`**). The `permissions` shape is **`WorkspacePermissionsInput`** (keys must exist on `workspaceAccessStatement`; empty objects are rejected at setup).
- **Membership:** The organization **`hasPermission`** path applies to the signed-in user’s relationship to that org—non-members do not pass. You **do not** need **`workspaceMembershipMiddleware`** in addition; use **one** of membership-only **or** permissions, not both stacked.
- **Errors:** Typically **`FORBIDDEN`** when the check fails.

```ts
protectedProcedure
  .input(yourSchemaWithWorkspaceId)
  .use(workspacePermissionsMiddleware({ invitation: ['create'] }))
  .mutation(({ input, ctx }) => {
    /* ... */
  })
```

## Membership vs permissions (do not stack both)

If the procedure is gated by **`workspacePermissionsMiddleware`**, that alone is sufficient—**do not** add **`workspaceMembershipMiddleware`** first.

Use **`workspaceMembershipMiddleware`** only when there is **no** suitable **`hasPermission`** check (e.g. some member-only reads that are not modeled as a permission).

```ts
protectedProcedure
  .input(yourSchemaWithWorkspaceId)
  .use(workspacePermissionsMiddleware({ invitation: ['create'] }))
  .mutation(/* ... */)
```

## Custom middleware

**`middleware`** (`t.middleware`) is exported from **`src/trpc/init.ts`** for one-off procedures. Prefer the shared workspace helpers when the rule is “member of workspace” or “has these org permissions”.

## Related

- Procedure layout and services: **[trpc-procedures.md](./trpc-procedures.md)**
- Permission keys and types: **`src/lib/workspace-access-control.ts`**
