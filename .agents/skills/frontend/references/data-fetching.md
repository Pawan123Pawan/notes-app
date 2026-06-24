# Data fetching and client/server data

Conventions for loading server data in **RSC** pages, **TanStack Query** and **tRPC** on the client, cache invalidation,
optimistic updates, and how that intersects with thin **`page.tsx`** composition.

**Cross-references**

- **`ui-and-client-data.md`** — forms, **`useMutation`**, **`showErrorToast`**, **client-owned lists**, and when **not** to
  rely on **`router.refresh()`** for small slices the query cache can own.
- **tRPC:** `node_modules/@trpc/server/skills/` plus adapter notes referenced from **AGENTS** intent-skills.
- **Side-effect discipline:** [`../../no-use-effect/SKILL.md`](../../no-use-effect/SKILL.md).

When you add or change rules here, keep the **[`SKILL.md`](../SKILL.md)** topic index accurate.

---

## RSC page loaders (`loader.ts`)

For **Next.js App Router** server components, **colocate** all server-side fetching and auth for a **`page.tsx`** in **`loader.ts`** next to that **`page.tsx`** (same folder). **`page.tsx`** imports **`./loader`**, calls **`load…`** / **`resolve…`** functions, and composes UI; **`loader.ts`** owns **`getCurrentSession`**, **`redirect`**, **`notFound`**, service/tRPC calls, and shared **`generateMetadata`** lookups.

- **Naming:** the file is always **`loader.ts`**. Export names describe behavior (**`loadWorkspaceHomePage`**, **`resolveIssuePageData`**, **`resolveProjectDetailsMetadata`**).
- **Separation:** keep **TanStack Query / client `useMutation`** in client components and **[shared hooks](#shared-hooks-for-the-same-query-and-derived-data)** as today; **`loader.ts`** is **RSC-only** data for the route segment.

Full placement and refactor workflow: **[SKILL.md — Page server loaders](../SKILL.md#page-server-loaders-loaderts)** and **[refactoring-principles.md — Page server loaders](./refactoring-principles.md#page-server-loaders-loaderts)**.

---

## Mutations and toast feedback

Use **`toast.promise`** from **`sonner`** for **loading**, **success**, and **error** toasts whenever you perform a **client
mutation** through **`useMutation`** (forms, dialogs, destructive confirms, inline actions).

1. **`toast.promise(asyncWork, { loading, success, error })`** — pass a **`Promise`** that completes when the mutation (and any
   chained follow-up such as **`invalidateQueries`**, **`router.push`**, **`router.refresh()`**) finishes successfully.
2. **Typical shape:** **`mutation.mutateAsync(input).then(async (result) => { … })`** inside **`toast.promise`** — match
   **`appearance-settings.tsx`** and **`general-settings.tsx`** under **`src/app/app/`**.
3. **`loading`** — concise copy while the promise is pending (e.g. **`Saving…`** / **`Creating project...`**).
4. **`success`** — confirmation when the promise resolves (string or callback per Sonner).
5. **`error`** — must resolve to something Sonner can show; prefer **`getErrorMessage(error, defaultMessage)`** from
   **`@/lib/utils`** so **`Error`**, **`ZodError`**, and unknown **`unknown`** values stringify consistently.

**Interaction with `useMutation`**

- Prefer **`mutateAsync`** for the promise passed to **`toast.promise`** (not **`mutate`** alone).
- Omit redundant **`onError`** handlers that only **`showErrorToast`** for the same user-visible path — **`toast.promise`**’s
  **`error`** option covers failure toasts for that flow.
- **`showErrorToast`** (and **`onError`**) remain appropriate where **`toast.promise`** is **not** used (fire-and-forget
  **`mutate`**, background mutations, or paths that intentionally skip loading/success toasts).
- Keep submit **`Button`** **`loading={mutation.isPending}`** (and **`disabled`** when product rules require it) alongside
  **`toast.promise`** — spinner/accessibility on the control; **`toast.promise`** carries narrative loading/success/error.

**Anti-pattern:** surfacing the same failure twice (e.g. **`onError`** + **`showErrorToast`** **and** **`toast.promise`**
**`error`** for one submission).

---

## Encapsulated UI mutations and orchestration callbacks

**Encapsulate data loading and imperative calls inside the UI module that owns the interaction** whenever the parent only needs a thin contract (**`value`** / **`onValueChange`**, **`onUploadCompleteAction`**, etc.). Prefer **`useQuery`** with **`trpc.*.queryOptions`** inside that component instead of lifting the same query into every dialog or form; TanStack Query dedupes by key, so many mounted pickers still share one network request.

**Examples of boundaries**

- **Design-system primitives** under **`src/components/ui/`** — **`multipart`** posts, **`FormData`**, **`useMutation`** for a single upload or token endpoint.
- **Shared app pickers** under **`src/components/`** (assignee/labels/list selectors) — **`useQuery`** for options, **`useMutation`** for inline creates when those actions are intrinsic to the popover.

**When it helps**

- Several dialogs/forms share the **same payload shape** or option list and should not duplicate **`FormData`**, tRPC **`queryOptions`**, error handling, or **`Button`** **`loading`** wiring.
- The parent only needs outcomes: merged **form values**, **`setQueryData`**, **`attachmentFileIds`** for **`mutateAsync`**, or a stable **`value`** from **`react-hook-form`** **`Controller`**.

**Queries alongside mutations**

1. Own **`useQuery`** inside the picker when **only this control** (or peers mounting the same query key) needs the data; expose **`value`** / **`onValueChange`** to the parent. If a parent must render **extra UI** from the same dataset (e.g. label chips beside the selector), export a **colocated hook** that reuses the **same** **`queryOptions`** / filter so the cache stays single-source — do not duplicate ad-hoc fetches at every call site.
2. Keep **page-level** or **view-level** queries for data that defines layout, grouping, or SSR hydration; do not hide that behind a leaf picker.

**Mutation shape (upload-style primitives)**

1. Own **`useMutation`** (or equivalent) **inside** the primitive; centralize **`showErrorToast`** / inline failure UX once when **`toast.promise`** is not wrapping that path.
2. Expose **orchestration callbacks** so callers stay authoritative over **business state**, not **`fetch`**:
   - Typical hooks: **`onUploadStartAction`**, **`onUploadCompleteAction`**, **`onUploadErrorAction`** (or other **`*Action`** names when tooling flags non‑Server Action handlers on client-boundary props — match existing **`components/ui`** patterns).
   - Prefer **`onUploadCompleteAction`** (or equivalent) whenever **`onSuccess`** runs, **including zero uploaded rows**, so callers can reliably clear **`isPending`** / busy gates.
3. Keep **route modules** responsible for **`toast.promise`** around **their** **`mutateAsync`** submits; primitives may still **`toast`** for purely internal failures if that stays one clear channel.

**Meta:** the primitive executes the query or imperative call; the route coordinates outcomes (**`react-hook-form`** **`setValue`**, barrier flags) — see **`[Staging and submit barriers](./state-management.md#staging-server-backed-values-and-submit-barriers)`**.

---

## Shared hooks for the same query and derived data

When **two or more client components** need the **same tRPC query** (same **`queryOptions`** / cache key) and often the **same derived structures** (maps, grouped indexes, sorted option lists built from **`data`**), extract a small hook under **`src/hooks/use-<domain>.ts`** instead of duplicating **`useQuery`** + **`useMemo`** at each call site.

1. **Single cache contract** — the hook calls **`useQuery`** with the canonical **`trpc.*.queryOptions({ ... })`** so every subscriber shares one TanStack Query entry; deduplication still applies when multiple components mount.
2. **Derived values live with the query** — return memoized **Maps**, **Record**s, or precomputed option arrays from the same hook when the transformation is identical everywhere (e.g. list id → color and name for issue rows).
3. **Lazy surfaces** — expose **`enabled`** (or forward specific **`useQuery`** overrides the team agrees on) when one UI only needs the data while a dialog is open; avoid copy-pasting **`queryOptions`** with different **`enabled`** flags without the shared hook.
4. **Naming** — prefer **`useThingById`**, **`useProjectListMetaById`**, etc., so imports read as **data hooks**, not presentational components.

**Counter-example:** do not add a shared hook for a query that only **one** component uses, or where derived shapes differ materially per screen—keep colocated **`useQuery`** until a **second** caller or identical derivation appears.

**Not the same as** encapsulated pickers (**`ListSelector`**, assignee selectors): those own **`useQuery`** because interaction and **`value` / `onValueChange`** live inside one component. Shared hooks are for **the same fetch + same derived index** reused across **different** trees (search palette, issue menu, another list renderer).
