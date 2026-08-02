---
name: frontend
description: >-
  Frontend work in this app: presentation code under src/app and src/components. Load for App Router route groups and
  AppShell, page metadata and dayjs (see references), component routing and placement,
  utility colocation (utils.ts vs src/lib), structuring route components, data-fetching UX patterns, forms and mutations
  per **ui-and-client-data.md**, alignment with **AGENTS.md** (Next.js banner + non-frontend repo rules), extracting UI
  without premature abstraction, **inlining duplicated simple form fields** (Field + Controller + one control) across
  forms instead of shared micro-components, deriving display props inside children when they follow from entity ids +
  shared hooks (minimize redundant parent props), **colocating component prop types** with the primary **`export`** module,
  **server page data in colocated **`loader.ts`** next to **`page.tsx`**, **composing distinct surfaces** (`children`, render
  props) instead of **`variant`** + **`switch`** routers where product UI diverges, keeping page chrome on server pages vs
  **`*-form.tsx`** clients, **programmatic `router.push` in `src/app/app/**`**: call **`triggerRouteProgressStart`** before
  push (not in **`(login)`**), **react-hook-form** (**`Controller`** for fields, never **`register`**; **`useForm`** as a named
  instance, no top-level destructure), encapsulating imperative **`useMutation`** inside **`components/ui`** with
  orchestration callbacks, submit barriers during staged uploads, and trigger-style primitives. **Empty collections / zero-row
  UX:** **`Empty`** primitives from **`@/components/ui/empty`** — see **[Empty states (`Empty` primitives)](#empty-states-empty-primitives)**. For refactors load
  **`references/refactoring-principles.md`**. Detailed rules live in linked reference files under this skill folder.
---

# Frontend development

Touch this skill whenever you work on **presentation and UI-bound data** in `src/app/**` or **`src/components/**`**:
screens, layouts, route component folders, server/client data wiring, JSX extraction. Product UI rules (**forms**,
**`PageHeader`**, **`AppShell`**, **`metadata`**, **dayjs**) live in **[references](./references/)**; **[`AGENTS.md`](../../../AGENTS.md)**
still holds the Next.js version banner and backend/worker/DB sections.

This skill is also the canonical home for project-specific frontend conventions that were previously duplicated in `AGENTS.md` (route structure, metadata/dayjs usage, UI/data patterns, and component placement).

---

## When to load this skill

- Adding or refactoring **route-level UI** (`page.tsx`, layouts, dialogs used by one segment).
- **Refactoring** a component (moving, splitting, collapsing wrappers, or renaming) — **[refactoring-principles.md](./references/refactoring-principles.md)**.
- **Component placement**: **`<page-route>/components/`** vs **`src/components/`**, naming, feature subfolders, exports.
- **Server-only page data** (**`loader.ts`** colocated with **`page.tsx`** — **[Page server loaders](#page-server-loaders-loaderts)**): auth, **`notFound`** / **`redirect`**, service calls, **`generateMetadata`** helpers; **`page.tsx`** stays chrome + composition.
- **Data in the UI** (canonical detail grows in **[Data fetching](./references/data-fetching.md)**): RSC + **`loader.ts`**, TanStack Query, tRPC, cache hints, **`src/hooks/`** for the same query + shared derived lookups when multiple components need them.
- **New or updated `page.tsx`** — **`metadata` / `generateMetadata`** — **[page-metadata.md](./references/page-metadata.md)**.
- **`dayjs`**, date formatting — **[dayjs.md](./references/dayjs.md)** (always import from **`@/lib/dayjs`**).
- **Route groups, website primitives, `AppShell`** — **[app-router-routes.md](./references/app-router-routes.md)**.
- **Extracting reusable pieces** without shared-folder sprawl on first use.
- **Simple form fields repeated in a few forms** — **inline** (duplicate the small **`Field` + `Controller` + control** block) rather than a shared “field component” file — **[Inline simple form fields](#inline-simple-form-fields-avoid-field-micro-components)**.
- **Component prop types** next to the **`export`** for that component (**`export type ThingProps`**) vs a sibling **`types.ts`** — **[Component prop types](./references/component-structure-and-routing.md#component-prop-types-colocate-with-the-component)** (`component-structure-and-routing.md`).
- **Composition over `variant` / `switch`** — shared base + dedicated exports; see **[Composition over variant switches](#composition-over-variant-switches)** and **[component-structure-and-routing.md](./references/component-structure-and-routing.md#component-prop-types-colocate-with-the-component)** (composition paragraph under **Component prop types**).
- **Derived props**: avoid threading values the child can compute from entities + **`src/hooks/`** — **[Derived props](#derived-props-minimize-redundant-parent--child-pass-through)** (this hub).
- **Pure helpers** (**`utils.ts`**) vs **`src/lib/<name>.ts`**; **segment-local `use-*.ts` hooks** beside **`utils.ts`** vs **`src/hooks/`** — **[util-placement](./references/util-placement.md)**.
- **Page chrome vs forms**: **`page.tsx`** / layouts own **`PageContainer`** and headers; client **`*-form.tsx`** modules stay form-focused — **[Page chrome vs child responsibility](#page-chrome-vs-child-responsibility)**.
- **Server-only pass-through wrappers** and **client container stacking**: do not add shallow containers with a single caller — **[refactoring-principles.md](./references/refactoring-principles.md)** (server vs client sections).
- **React Hook Form**: **`Controller`** for fields (never **`register`**); bind **`useForm`** to a **`form`** variable (never destructure) — **[React Hook Form](#react-hook-form)**.
- **Local state vs form**: toggles and flags on the submit surface belong on **`useForm`** when practical — **[state-management](./references/state-management.md)**.
- **Staging server-backed payloads and submit barriers** on dialogs/forms — **[state-management](./references/state-management.md)** (derived API shape at submit, block submit while uploads run).
- **Programmatic navigation in the authenticated app** (**`src/app/app/**`**) and **`triggerRouteProgressStart`** — **[Route transition progress](#route-transition-progress-triggerrouteprogressstart)**.
- **Empty lists, zero-result queries, filtered tabs with no rows** — **`Empty`** primitives (**`@/components/ui/empty`**) — **[Empty states (`Empty` primitives)](#empty-states-empty-primitives)**.

---

## Topic index

| Topic                                                                                   | Reference                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **`metadata` / `generateMetadata` on `page.tsx`**                                        | **[page-metadata.md](./references/page-metadata.md)**                                              |
| **`dayjs` imports and plugins**                                                          | **[dayjs.md](./references/dayjs.md)**                                                              |
| **Route groups `(landing)` / `(website)` / `(login)` / `app/`, `AppShell` wiring**       | **[app-router-routes.md](./references/app-router-routes.md)**                                      |
| **Forms, `Button` loading, mutations, `PageContainer`, breadcrumbs, tabs, client lists**  | **[ui-and-client-data.md](./references/ui-and-client-data.md)**                                    |
| **Component structure, route `components/` folders, naming, exports**                  | **[component-structure-and-routing.md](./references/component-structure-and-routing.md)**            |
| **Server page data — `loader.ts` beside `page.tsx`, exports, metadata helpers**         | **[Page server loaders](#page-server-loaders-loaderts)** (this hub) and **[component-structure-and-routing.md](./references/component-structure-and-routing.md)**                                                               |
| **Prop types (`ComponentProps`, variants) — same file as the component export**           | **[Component prop types](./references/component-structure-and-routing.md#component-prop-types-colocate-with-the-component)** (`component-structure-and-routing.md`)                                                                  |
| **Composition vs `variant` / `switch` (shared base + `Comment`-style wrappers)**           | **[Composition over variant switches](#composition-over-variant-switches)** (this hub)                                                                              |
| **Repeat field markup in sibling forms — inline vs extract**                                   | **[Inline simple form fields](#inline-simple-form-fields-avoid-field-micro-components)** (this hub)                                                                 |
| **Utility placement & route-local hooks (`utils.ts`, `use-*.ts`)**                       | **[util-placement.md](./references/util-placement.md)**                                             |
| **Page chrome vs client forms (`*-form.tsx`)**                                           | **[Page chrome vs child responsibility](#page-chrome-vs-child-responsibility)** (this hub)       |
| **React Hook Form — `Controller` (no `register`), `useForm` as `const form` (no destructure)** | **[React Hook Form](#react-hook-form)** (this hub)                                                 |
| **Refactoring UI modules (workflow, nested UI decomposition, shallow wrappers, container stacking)** | **[refactoring-principles.md](./references/refactoring-principles.md)**                            |
| **Data fetching & server/client data**                                                   | **[data-fetching.md](./references/data-fetching.md)** (RSC **`loader.ts`**, mutations + **`toast.promise`**, TanStack Query, tRPC) |
| **Bulk actions (many selected rows — one gesture)**                                         | **[Bulk actions → one tRPC mutation](#bulk-actions--one-trpc-mutation)** (this hub) + backend **[Bulk actions from the client](../backend/SKILL.md#bulk-actions-from-the-client)** |
| **Top bar route progress — programmatic `router.push` under `/app`**                     | **[Route transition progress](#route-transition-progress-triggerrouteprogressstart)** (this hub) |
| **Empty collections, zero rows, inactive tabs after data loads**                         | **[Empty states (`Empty` primitives)](#empty-states-empty-primitives)** (this hub) |
| **Same query + derived maps reused in multiple components — `src/hooks/use-*.ts`**       | **[Shared hooks for the same query](./references/data-fetching.md#shared-hooks-for-the-same-query-and-derived-data)** (`data-fetching.md`) |
| **Local UI state vs `react-hook-form` (when to put flags on the form)**                  | **[state-management.md](./references/state-management.md)**                                       |
| **Encapsulated client queries/mutations in UI primitives + orchestration callbacks** | **[Encapsulated UI](./references/data-fetching.md#encapsulated-ui-mutations-and-orchestration-callbacks)** (`data-fetching.md`)                                                         |
| **Submit barriers, staged uploads, deriving API payloads at submit**                        | **[Staging and submit barriers](./references/state-management.md#staging-server-backed-values-and-submit-barriers)** (`state-management.md`)                                                      |
| **Trigger-style composition on design-system primitives**                                 | **[Trigger-style props](./references/component-structure-and-routing.md#trigger-style-props-srccomponentsui)** (`component-structure-and-routing.md`)                                               |
| **Derived props — minimize redundant parent → child pass-through**                         | **[Derived props](#derived-props-minimize-redundant-parent--child-pass-through)** (this hub)                                                                        |
| **Server-only “layout body” wrappers (when not to extract)**                              | **[refactoring-principles.md — Server-only shallow wrappers](./references/refactoring-principles.md#server-only-shallow-wrappers)**                               |
| **Client pass-through containers (merge into parent file)**                                | **[refactoring-principles.md — Client container stacking](./references/refactoring-principles.md#client-container-only-siblings-merge-do-not-stack)**              |
| **Route `components/` splits — no re-export-only barrels**                                  | **[refactoring-principles.md — Re-export-only route barrels](./references/refactoring-principles.md#re-export-only-route-barrels)**                                 |

_Add new topical files under **`references/`** and add a row above so tooling and agents anchor on this hub._

**How to navigate**

1. Open **`SKILL.md`** (this file) for triggers and breadth.
2. Follow the linked **`references/*.md`** for rules, examples, and checklists — for **refactors**, prefer **`references/refactoring-principles.md`** as the dedicated checklist.

---

## Global cross-references

- **Forms, selects, mutations, toasts, client-owned lists, workspace page chrome**: **[ui-and-client-data.md](./references/ui-and-client-data.md)**.
- **`react-hook-form`:** **`Controller`** only for field wiring — no **`register`**. **`useForm`:** bind to **`const form`** — never top-level destructure — **[React Hook Form](#react-hook-form)** (this hub) + **ui-and-client-data** for shared product rules.
- **Next.js unfamiliar APIs / deprecation**: [`AGENTS.md`](../../../AGENTS.md) (version banner) plus `node_modules/next/dist/docs/`. **Route groups and `AppShell`**: **[app-router-routes.md](./references/app-router-routes.md)**.
- **Board-level drag-and-drop quality bar**: [`../kanban-dnd/SKILL.md`](../kanban-dnd/SKILL.md).
- **No direct `useEffect`** in React product components: [`../no-use-effect/SKILL.md`](../no-use-effect/SKILL.md).
- **Nuqs URL state**: [`../nuqs/SKILL.md`](../nuqs/SKILL.md).
- **Refactoring UI modules** (workflow, **`loader.ts`**, shallow wrappers, client container stacking): **[`references/refactoring-principles.md`](./references/refactoring-principles.md)**.
- **Composition vs `variant` / `switch`** (shared base + separate exports): **[Composition over variant switches](#composition-over-variant-switches)**.
- **Same small field repeated in multiple forms**: **[Inline simple form fields](#inline-simple-form-fields-avoid-field-micro-components)** — prefer duplication in each form file over a shared one-off field component.
- **Upload primitives, staged payloads, submit barriers**: **[Reusable primitives and honest submit surfaces](#reusable-primitives-and-honest-submit-surfaces)** (this hub) plus **`references/data-fetching.md`**, **`state-management.md`**, **`component-structure-and-routing.md`** sections linked there.
- **Authenticated shell navigation + top progress bar**: **`triggerRouteProgressStart`** — **[Route transition progress](#route-transition-progress-triggerrouteprogressstart)**.
- **Empty product states (lists, inboxes, drive)**: **`Empty`**, **`EmptyHeader`**, **`EmptyMedia`**, **`EmptyTitle`**, **`EmptyDescription`** — **[Empty states (`Empty` primitives)](#empty-states-empty-primitives)**.

## Quick anchors (thin summary; drill into references above)

### Page server loaders (`loader.ts`)

- **Location:** for a route segment that owns **`page.tsx`**, put **server-only** functions that load data for that page in **`loader.ts`** in the **same directory** as **`page.tsx`** (not under **`components/`**). Import from **`page.tsx`** as **`./loader`**.
- **Filename:** always **`loader.ts`** (not **`page-loader.ts`**, **`*-page-data.ts`**, or per-route bespoke names) so agents and readers can find server fetch logic in one convention.
- **Contents:** async **`load…`** / **`resolve…`** functions (**`loadWorkspaceHomePage`**, **`resolveIssuePageData`**, **`loadProjectSettingsPage`**, etc.), **`generateMetadata`** helpers that share the same lookups (**`resolveProjectDetailsMetadata`**, **`resolveWorkspaceHomeMetadata`**), description strings reused by metadata and docs, and **types** tied to the loader (**`IssueDetailsPageProps`**, **`IssueDetailPageData`**, **`Awaited<ReturnType<typeof load…>>`**). Use **`redirect`**, **`notFound`**, and session checks here so **`page.tsx`** focuses on **layout, breadcrumbs, and composing** **`./components/...`**.
- **Consumers:** **`page.tsx`**, and **non-UI modules** in the same segment that need the same row types (**`utils.ts`** may **`import type`** from **`./loader`**). Prefer **not** importing **`loader.ts`** from **`components/`** — pass data as props from the page. **`layout.tsx`** may import the same **`loader.ts`** only when a loader is genuinely shared; otherwise keep layout-specific fetches in **`layout.tsx`** or a colocated layout helper.
- **Full checklist and refactor workflow:** **[refactoring-principles.md — Page server loaders](./references/refactoring-principles.md#page-server-loaders-loaderts)**.

### Component placement

- Route-owned **`*.tsx`**: **`src/app/…/<page-route>/components/`** — full guidance in **[component-structure-and-routing](./references/component-structure-and-routing.md)**.
- Shared **`src/components/`** only after a confirmed **second caller** outside that route subtree.
- **Component prop types**: define **`type`** / **`export type`** for that component’s props (**`ThingProps`**, discriminated variants, aliases used only here) **in the same **`*.tsx`** file** as the primary **`export function Thing`** — keep sibling **`types.ts`** for **shared** shapes (Zod schemas, DTOs, form values imported by several modules). See **[Component prop types](./references/component-structure-and-routing.md#component-prop-types-colocate-with-the-component)**.
- **Composition vs `variant` routers**: prefer a **base + render-prop actions + separate exports** — see **[Composition over variant switches](#composition-over-variant-switches)**.
- **Tiny field blocks repeated across sibling forms**: **inline** instead of **`…-field.tsx`** wrappers unless the chunk is a real leaf — **[Inline simple form fields](#inline-simple-form-fields-avoid-field-micro-components)**.
- **Route chrome vs forms**: **`PageContainer`**, **`Breadcrumb`**, **`PageHeader`** on **`page.tsx`** or layout; client **`*-form.tsx`** modules handle only interactivity — see **[Page chrome vs child responsibility](#page-chrome-vs-child-responsibility)**.

### Composition over variant switches

When two surfaces share **behavior** (e.g. Markdown body, edits, uploads, **`listIssueComments`**) but differ in **chrome and actions** (thread resolve + nested replies vs inline reply menu + delete), **do not** default to one mega-component that takes **`variant: 'thread' | 'reply'`** and branches at the root with **`switch`** / early **`return`** between inner “entities”. That tends to duplicate **`useMutation`** instances, splits **`isPending`** across Parents and Children, and entangles unrelated layout.

**Prefer**

1. A **file-local base** that owns the shared interactive surface — e.g. **`CommentMessageBody`** in **`src/app/.../issue/[issueId]/components/comment/comment.tsx`**: author + read/edit markdown + attachment rows; takes **`updateComment`** from the parent so thread-level actions (resolve) and body edits share one mutation handle when they must stay in sync.
2. **`actions`** as a **render prop** (or **`children`**) so each wrapper passes the right menu: **`actions={({ beginEdit }) => <ThreadActionsMenu onEdit={beginEdit} ... />}`** vs a reply **`DropdownMenu`**.
3. **Separate exports** for each product surface: **`export function Comment`** (thread card, resolved shell, maps **`CommentReply`**) and **`export function CommentReply`** (reply row + delete dialog), each composing the base — no top-level **`variant`** router.

**Illustrative shape** (names trimmed; real module linked above):

```tsx
function CommentMessageBody({
  comment,
  updateComment,
  actions,
  editPlaceholder,
  saveToast,
}: {
  comment: CommentBodyRow
  updateComment: IssueCommentUpdateMutationHandle
  actions: (api: { beginEdit: () => void }) => React.ReactNode
  editPlaceholder: string
  saveToast: { loading: string; success: string; errorDefault: string }
}) {
  /* useForm, Controller, FileUploader, MarkdownEditor, CommentAttachmentRows */
}

export function Comment(props: CommentProps) {
  const updateComment = useIssueCommentUpdateMutation(...)
  return (
    <ThreadCard>
      <CommentMessageBody
        comment={props.comment}
        updateComment={updateComment}
        editPlaceholder="Edit comment..."
        saveToast={{ loading: '…', success: '…', errorDefault: '…' }}
        actions={({ beginEdit }) => (
          <ThreadActionsMenu onEdit={beginEdit} isUpdatePending={updateComment.isPending} ... />
        )}
      />
      {props.replies.map((r) => (
        <CommentReply key={r.id} comment={r} ... />
      ))}
    </ThreadCard>
  )
}

export function CommentReply(props: CommentReplyProps) {
  const updateComment = useIssueCommentUpdateMutation(...)
  return (
    <div className="group/reply ...">
      <CommentMessageBody
        comment={props.comment}
        updateComment={updateComment}
        editPlaceholder="Edit reply..."
        saveToast={{ loading: '…', success: '…', errorDefault: '…' }}
        actions={({ beginEdit }) =>
          props.canEditDelete ? (
            <ReplyActionsMenu onEdit={beginEdit} ... />
          ) : null
        }
      />
      <DeleteCommentAlertDialog ... />
    </div>
  )
}
```

**Avoid** (same file growing a discriminated union and dispatch):

```tsx
export function Comment(props: CommentProps | CommentReplyProps) {
  if (props.variant === 'reply') {
    return <CommentReplyBranch {...props} />
  }
  return <CommentThreadBranch {...props} />
}
```

Use **`variant`** only when branches are **trivially the same tree** with small styling differences — not when hooks, mutation scope, or surrounding layout diverge. More detail: **[component-structure-and-routing.md — Component prop types](./references/component-structure-and-routing.md#component-prop-types-colocate-with-the-component)**.

### Refactoring

For **workflow** (placement → **inspect nested UI before lift-and-shift** → import graph → **`loader.ts`** for server fetches → collapse single-caller client wrappers), **server-only shallow wrappers**, and **client container-only siblings**, load **[refactoring-principles.md](./references/refactoring-principles.md)** — one reference for agents instead of duplicating rules in this hub. When a **`page.tsx`** grows **`getCurrentSession`**, workspace/project/issue resolution, and service calls, **extract** that logic into colocated **`loader.ts`** per **[Page server loaders](#page-server-loaders-loaderts)**.

### Shared components vs feature-specific behaviour

- **Prefer composition slots** (`renderActions`, `children`, optional render props) for behaviour that only **some** call sites need (drag handles, layout chrome, secondary toolbars).
- **Avoid boolean switches** that pull unrelated domains into a shared module (e.g. `reorderDrag` wiring **`useDraggable`** inside **`IssueListRow`**). Keep **`src/components/**`** rows/presentational shells focused; **views** that own DnD, modals, or route quirks pass UI via slots and attach refs/hooks beside or above the shared piece.
- **Trigger-style primitives** (**`trigger`**) under **`src/components/ui/`**: the parent passes the visible control; the primitive owns the hidden picker/input and merges **`loading`**, **`disabled`**, and **`onClick`** onto **`trigger`** (see **`[component-structure-and-routing](./references/component-structure-and-routing.md#trigger-style-props-srccomponentsui)`**).

### Inline simple form fields (avoid field micro-components)

When **two or more sibling forms** (e.g. separate dialogs or **`*-form.tsx`** surfaces) both need **the same small control** — a **`Field`** + **`FieldLabel`** + **`Controller`** wrapping a single **`Select`**, **`Input`**, checkbox, etc. — **prefer inlining that block in each form** rather than extracting **`workspace-invite-role-field.tsx`**-style wrappers.

**Why:** shared “field components” rarely earn their own file unless the control grows **meaningful variation** (several layouts, conditional help text, multiple internal hooks) or has **many** call sites across **unrelated** routes. Otherwise you pay extra navigation, generic **`Control<T>`** / prop types, and import churn for a few dozen lines of repetitive but obvious markup.

**Extract when it’s no longer a trivial field**

- The chunk becomes a **real leaf** (complex validation UI, async search, file dropzone, DnD row) or is imported from **three+** places with **identical** behaviour.
- The repetition spans **unrelated** feature folders and belongs in **`src/components/`** as a design-system or domain primitive — still not a route-local **`*-field.tsx`** that only two neighbors use.

**Keep shared:** Zod schemas, option lists, and **`formatX`** helpers in colocated **`utils.ts`** (or **`src/lib`** when cross-route) so inlined fields stay consistent without a wrapper component.

### Derived props (minimize redundant parent → child pass-through)

When a prop is **fully determined** by data the child already receives (plus stable route scope like **`workspaceSlug`** / **`projectId`**), **derive it inside the child** instead of pushing it through every ancestor. That cuts coupling, avoids duplicated lookups (**`lists.find((l) => l.id === issue.projectListId)`**), and keeps call sites smaller.

**Prefer**

- **`IssueCard`** receives **`issue`** (with **`projectListId`**) and **`workspaceSlug`** / **`projectId`**; inside the card, **`useProjectListMetaById`** + **`listMetaById.get(issue.projectListId)?.color`** supplies list stripe color. Parents (**`BoardView`**, **`DraggableIssueCard`**) do **not** pass **`listColor`**.

**Avoid**

- **`listColor={lists.find(...) ?? fallback}`** on every **`IssueCard`** usage when **`issue.projectListId`** is already on **`issue`**.

**When parents should still pass data**

- Values that **override** normal derivation (**“preview as if on list X”**), **vary per render slot** without living on the entity, or come from **ancestor-only UI state** that the child cannot access cleanly — keep those as explicit props or composition (**`children`**, render props).

TanStack Query dedupes **`listProjectLists`** by key; multiple mounted cards each calling **`useProjectListMetaById`** share one cached query. For **shared memo maps** without subscribing every leaf, see **[Shared hooks for the same query](./references/data-fetching.md#shared-hooks-for-the-same-query-and-derived-data)** (`data-fetching.md`).

### Reusable primitives and honest submit surfaces

- **Orchestration vs encapsulated fetch/mutation**: a **`ui`** module or shared picker may own **`useQuery`** / **`useMutation`** for one boundary and expose **`value`** / **`onChange`** or **start / success / error** callbacks so route clients update **form**, cache, or busy flags — **[Encapsulated UI](./references/data-fetching.md#encapsulated-ui-mutations-and-orchestration-callbacks)**.
- **Submit barriers**: disable the primary submit control **and** short-circuit **`handleSubmit`** when secondary async work must finish first (e.g. attachment upload producing ids the mutation needs) — **[Staging and submit barriers](./references/state-management.md#staging-server-backed-values-and-submit-barriers)**.
- **Stage on the form, serialize at submit**: keep upload API rows or equivalent metadata **in RHF**, derive **`attachmentFileIds`-style payloads** inside the submit handler from form values — same reference.

### Data fetching

- Prefer **data-fetching primitives and RSC boundaries** over ad-hoc **`useEffect`** fetch — **[data-fetching](./references/data-fetching.md)** and **no-use-effect**.
- **Mutations:** **`toast.promise`** + **`mutateAsync`** for loading/success/error toasts — **[Mutations and toast feedback](./references/data-fetching.md#mutations-and-toast-feedback)**.
- **Encapsulated fetches and mutations in UI primitives:** move **`useQuery`** / **`useMutation`** into the component that owns the picker or upload boundary whenever parents only need **`value`** / **`onChange`** and orchestration callbacks — **[Encapsulated UI mutations and orchestration](./references/data-fetching.md#encapsulated-ui-mutations-and-orchestration-callbacks)** (`data-fetching.md`).
- **Repeated query + same derivation:** when multiple components call the same **`queryOptions`** and build the same **memoized lookup** from **`data`**, add **`src/hooks/use-<domain>.ts`** — **[Shared hooks for the same query](./references/data-fetching.md#shared-hooks-for-the-same-query-and-derived-data)** (`data-fetching.md`). Prefer that over duplicating **`useQuery`** + **`useMemo`**; still **not** for one-off screens or meaningfully different shapes per caller. **Exception:** duplicated **`useMutation`** options between **sibling route views** → extract **`use-<domain>.ts`** beside **`utils.ts`** first (**[util-placement](./references/util-placement.md)**); lift to **`src/hooks`** only when a **second unrelated segment** needs it.
- **Bulk actions (many rows or recipients in one click):** one **`mutateAsync`** to a **single** tRPC procedure that accepts an array — **[Bulk actions → one tRPC mutation](#bulk-actions--one-trpc-mutation)**; do not **`Promise.all`** separate client calls for the same toolbar/button.

### Bulk actions → one tRPC mutation

When the user confirms a **single** action that affects **many** entities (e.g. “Resend selected” on a table), call **one** tRPC **mutation** with a **batch payload** (`{ workspaceId, invitations: [...] }`, etc.). The server loop or service performs per-item work and returns one result (or one **`TRPCError`**).

**Do not** fan out from the client with **`Promise.all`** over **`authClient`**, **`fetch`**, or repeated **`trpc.*.mutateAsync`** for the **same** button or menu action— that multiplies round-trips, makes partial failure UX harder to align, and skips shared limits/validation on the server. Pair with backend **[Bulk actions from the client](../backend/SKILL.md#bulk-actions-from-the-client)** when adding procedures.

### Empty states (`Empty` primitives)

Use **[`src/components/ui/empty.tsx`](../../../src/components/ui/empty.tsx)** for **product empty states** once data has finished loading and the collection is **empty** — lists, inboxes, drive folders, filtered tabs with zero rows, etc. Prefer this over a bare **`<p className="text-muted-foreground">`** so spacing, dashed border, and title/description hierarchy stay consistent.

**Exports:** **`Empty`**, **`EmptyHeader`**, **`EmptyMedia`** (optional **`variant="icon"`** with a small Lucide icon inside), **`EmptyTitle`**, **`EmptyDescription`**, **`EmptyContent`**. Compose **`Empty` → `EmptyHeader` → `EmptyMedia` + `EmptyTitle` + `EmptyDescription`** (add **`EmptyContent`** when the empty state needs extra actions or helper links).

**Do not** use these for **`isPending`** / skeleton first paint unless product explicitly wants an “empty” placeholder during loading (default: short loading line or skeleton patterns from **[data-fetching](./references/data-fetching.md)**).

**Where to put the JSX:** Prefer composing **`Empty`** in the **same client module** that runs the list/query (e.g. **`my-drive-view.tsx`**) when the empty state is static copy and icons—fewer files and a single place to read loading / error / empty / list behavior. Use **`page.tsx`** + server **`children`** only when the empty panel must stay a **Server Component** (e.g. server-fetched hints or links you do not want imported into the client file); pass that panel as **`children`** into the client boundary, not as a **prop** (Next.js does not allow passing server components as props to client components).

### Route transition progress (`triggerRouteProgressStart`)

The workspace chrome (**`AppShell`**) renders a thin top progress bar during in-app navigations. **`useRouteTransitionProgress`** ([`src/hooks/use-route-transition-progress.ts`](../../../src/hooks/use-route-transition-progress.ts)) starts that bar when users **click same-origin `<a href>`** links; **it does not run for programmatic `router.push`**.

**In client components under the authenticated product** (`src/app/app/**` — URLs under **`/app/...`**, including **`/app/onboarding`**, **`/app/accept-invitation`**, and **`/app/[workspaceSlug]/...`**):

- Call **`triggerRouteProgressStart(destinationHref)`** from [`@/lib/route-progress`](../../../src/lib/route-progress.ts) **immediately before** **`router.push(destinationHref)`** when the push goes to a **different** pathname + search than the current URL (same route is a no-op — the helper compares pathname + query).
- Pass the **same string** you pass to **`router.push`** (absolute path from the site root, e.g. **`/app/ws/project/…`**, **`/`** for post-delete landing). Relative hrefs are resolved against **`window.location`**.

**Do not** add **`triggerRouteProgressStart`** on **`src/app/(login)/**`** routes: **`RouteTransitionProgress`** is not mounted there, so the event has no listener; **`router.push`** alone is enough.

**Server** **`redirect()`** in **`loader.ts`** / layouts does not need **`triggerRouteProgressStart`**. **`router.refresh()`** without a URL change does not need it either.

### Utility functions & route-local hooks (`utils.ts`, `use-*.ts`)

- Keep **page- or component-scoped** pure helpers beside their consumers as **`utils.ts`** (narrowest owning folder).
- Move **widely reused** helpers to **`src/lib/<domain>.ts`** (e.g. `groupIssues` + related → **`issues.ts`**), not preemptively — **[util-placement](./references/util-placement.md)**.
- **`use-*.ts` hooks** that duplicate **`useMutation`** or **`useQuery`** wiring across sibling views under the same **`components/`** folder live beside **`utils.ts`** (**`use-<kebab-domain>.ts`**, export **`useCamelCase`**). Example: **`components/use-reorder-project-issue.ts`** shared by **`board-view`** and **`list-view`**. Promote to **`src/hooks/`** only when **unrelated** routes need the same hook — same **[util-placement](./references/util-placement.md)** promotion rule as **`utils`** vs **`src/lib`**.

### Form-adjacent state

- Prefer **[form-owned fields](./references/state-management.md)** for switches and toggles rendered **inside** the same **`useForm`** surface (exclude non-API keys when building **`mutateAsync`** input).

### React Hook Form (`useForm` + `Controller`)

- **Field binding:** always **`Controller`** with **`control={form.control}`** — never **`register`** — full rules in **[React Hook Form](#react-hook-form)**.
- **Hook shape:** **named instance** **`const form = useForm(...)`** — never destruct **`useForm`** at the declaration — same section.

---

## Page chrome vs child responsibility

Move **page-level layout and navigation chrome** (**`PageContainer`**, **`Breadcrumb`**, **`PageHeader`**, tab shells that mirror the route, etc.) to the **parent `page.tsx` or `layout.tsx`** when you can — especially when the interactive part is a **`'use client'`** boundary. Server components then own **document framing**; the client subtree stays smaller and matches **[ui-and-client-data.md](./references/ui-and-client-data.md)** workspace patterns (breadcrumbs above **`PageHeader`** with **`gap-4`**, **`PageContainer`** wrapper) without pushing that structure through **`'use client'`**.

**Children own their behavior, not the parent’s shell.** A client module colocated with a route should focus on **forms, mutations, and local UI state** — not on wrapping or re-defining **whole-page** layout that belongs on the server page.

**Server markup that is only composed once:** avoid a separate **server** “body” module that only forwards props into other server children — see **[Server-only shallow wrappers](./references/refactoring-principles.md#server-only-shallow-wrappers)** (`refactoring-principles.md`).

### Dedicated client form modules (`*-form.tsx`)

When **`page.tsx`** is mostly chrome plus one interactive surface:

- Extract the client piece under **`<page-route>/components/<feature>-form.tsx`** (canonical per **[component-structure-and-routing](./references/component-structure-and-routing.md)**); **`page.tsx`** imports **`./components/...`** — do not leave route-specific **`*.tsx`** beside **`page.tsx`** except Next.js segment files.
- Export **`CreateThingForm`**, **`EditThingForm`**, etc.
- Use the **`*-form.tsx`** filename (e.g. **`create-project-form.tsx`**) so the file name signals **form-only** responsibility and **`page.tsx`** remains the single owner of **`PageContainer`**, **`PageHeader`**, and breadcrumbs.

---

## React Hook Form

When using **`react-hook-form`** in **`src/app/**`** and **`src/components/**`** (with **`Controller`**, **`useWatch`**, **`handleSubmit`**, Zod + **`zodResolver`**, etc.):

### Field binding (`Controller` only)

- **Always** wire fields with **`Controller`** from **`react-hook-form`**, passing **`control={form.control}`**, **`name`**, and a **`render`** that connects **`field`** (and **`fieldState`**) to the design-system control.
- **Never** use **`register`** from **`useForm`** for **`Input`**, **`Textarea`**, **`Select`**, **`Switch`**, or other app UI primitives — **`register`** does not apply to Radix **`Select`** and other controlled components, and this codebase standardizes on **`Controller`** for one consistent pattern.
- Match **[ui-and-client-data.md](./references/ui-and-client-data.md)** (**`Controller`** for **`Input`** / **`Textarea`**, **`Select`** with **`Controller`** and **`value`** / **`onValueChange`**).

### `useForm` instance (never destructure)

1. **Never destructure** the return value of **`useForm(...)`** at the declaration — avoid **`const { control, handleSubmit, formState, setValue } = useForm(...)`**.
2. Use a **named instance**: **`const form = useForm<Values>({ ... })`**, then **`form.control`**, **`form.handleSubmit`**, **`form.formState`**, **`form.setValue`**, etc.
3. Use **`useWatch({ control: form.control, ... })`** (prefer **`useWatch`** over **`watch`** — **[ui-and-client-data.md](./references/ui-and-client-data.md)**).
4. **Multiple forms** in one component: distinct instances (**`const mainForm = useForm(...)`**, **`const dialogForm = useForm(...)`**) without renaming destructured bindings.

**Why:** two or more **`useForm`** calls would collide on **`control`**, **`handleSubmit`**, and other destructured names; the instance pattern scales cleanly. **`Controller`** + **`form.control`** is the single field-wiring path for both native-shaped and custom controls.

Refactor **`register`** and top-level **`useForm`** destructuring when you touch a file for other reasons, or when adding a second form in the same module.
