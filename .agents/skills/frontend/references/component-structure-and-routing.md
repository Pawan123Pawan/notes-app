# Component structure and routing

How to **place**, **name**, **export**, and **colocate** components under `src/app/**` and **`src/components/**`**.

See the skill hub [`../SKILL.md`](../SKILL.md) for the index of all frontend topics.

---

## Guiding principle: colocate first

1. Put **route-only UI** under **`<page-route>/components/`** (the `components/` directory alongside that segment’s `page.tsx` /
   `layout.tsx`), unless a second unrelated route needs it—then lift to `src/components/`.
2. Prefer **thin `page.tsx` files**: data loading, metadata, breadcrumbs shell; defer heavy JSX to modules imported from **`./components/...`** (relative to `page.tsx` in that segment).
3. **Lift toward `src/components/`** only when two or more routes (or unrelated domains such as landing + product) genuinely share the UI.

Wrong direction: dumping everything into `src/components/` “for reuse” before a second caller exists—this scatters imports and hides context.

---

## Component prop types (colocate with the component)

Define **React component prop types** in the **same file** as the primary component **`export`** (e.g. **`export type CommentProps`**, **`export type DialogProps`**, discriminated unions for **`variant`**-style APIs, local **`type`** aliases consumed only inside that module).

- **Prefer** **`types.ts`** (or **`*.types.ts`**, **`schema.ts`**) beside the feature folder when the definition is **imported by more than one module** — Zod schemas, shared DTO/view-model rows, **`CommentEditFormValues`** used by form + validator, payloads mirrored with tRPC input types, etc.
- **Prefer** prop types **in `thing.tsx`** when **only `Thing`** (and its file-local helpers) consume them — readers see the surface next to implementation; avoid a **`types.ts`** that exists only as a Props junk drawer for a single component.

External callers that need strong typing (**`extends ComponentProps`**, Storybook wrappers) can **`export type`** from that component module.

When the same domain has **distinct product surfaces** (e.g. a thread root vs an inline reply), **prefer composition**: a small **base** module (shared body, hooks, or **`children` / render props**) plus **separate exports** that wrap it (`ThreadComment`, `ReplyRow`) instead of one mega-component with a **`variant`** prop and top-level **`switch`** / early returns. Keeps hooks and layout honest and avoids desynced **`isPending`** from duplicate mutation instances.

---

## Mental model

| Kind of UI                                           | Typical location                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route-only** composition                           | **`src/app/…/<page-route>/components/`** (shorthand: **`<page-route>/components/`**) — no stray **`*.tsx`** next to **`page.tsx`** except Next.js segment files (**`layout.tsx`**, **`loading.tsx`**, **`error.tsx`**, **`not-found.tsx`**, etc.).                                                               |
| **Product UI shared across many unrelated routes**   | **`src/components/**`** — only when callers span multiple route subtrees                                                                                                                                                                                                                                             |
| **Primitive / design-system** UI                     | `src/components/ui/*`                                                                                                                                                                                                                                                                                         |
| **Small leaf used in one subtree**                   | Under **`components/`** — either `components/feature-name.tsx` or `components/feature/leaf.tsx` next to sibling files                                                                                                                                                                                         |

See **Worked examples** below for each row.

---

## Target directory layouts

### Shared product components

Primitives and **truly multi-route** composites live under **`src/components/`** (and **`src/components/ui/`** for design-system pieces).

### Trigger-style props (`src/components/ui`)

Several primitives expose a **`trigger`** prop: **`React.ReactElement`** (**`Button`**, **`BaseButton`**) that the primitive **augments**.

- Own the interactive plumbing (**hidden `<input type="file">`**, **`Popover`**, **`DialogTrigger`**, calendar shell) inside the **`ui`** module.
- Merge props onto **`trigger`** with **`cloneElement`** (chain **`onClick`** after any existing handler; set **`disabled`** and **`loading`** when uploads or pickers are **`isPending`**) so callers keep full control over **appearance** (**`variant`**, **`size`**, **`aria-`** labels).
- Mirrors **explicit composition** (**`PopoverTrigger`** + **`asChild`**) but keeps call sites ergonomic when one affordance kicks off opaque behavior (**`DatePicker`**, **`FileUploader`**, future pickers).

Keep **route-specific** behavior (**toasts** only when `files.length > 0`, **`useForm`** **`setValue`**) in the **`app`** caller; primitives stay narrowly reusable.

When a composite is **scoped to one segment** (mounted from a single `layout.tsx` subtree), treat it like other route-owned UI:

```
src/app/app/[workspaceSlug]/components/app-shell/
  app-shell.tsx
  …                          # user menu, workspace switcher, nav helpers, etc. colocated with the shell
```

Shared pieces used from many unrelated routes (**`src/components/icons`**, **`src/components/providers`**) stay **`src/components/**`.

```
src/components/
  ui/
    button.tsx
    dialog.tsx
    …
```

### Route segment layout: **`src/app/…/<page-route>/components/`** (canonical)

Treat **`page-route`** as “the filesystem folder that implements this URL”—for instance **`…/project/[projectId]/`**,
**`…/issue/[issueId]/`**, **`…/project/[projectId]/settings/`**—**not** a literal directory named **`page-route`** (the idea is **`src/page-route/components` → “under that route segment, use a `components/` folder.”**).

**All route-specific `*.tsx` modules** for that segment live under **`components/`** next to **`page.tsx`**. Imports from **`page.tsx`**
(or **`layout.tsx`**) always start with **`./components/...`**.

```
<page-route>/
  page.tsx                     # Thin: metadata, breadcrumbs, composing children (data from ./loader when used)
  loader.ts                    # Optional: server-only load/resolve functions for this page (see SKILL.md)
  layout.tsx                   # When present: segment shell only — not a dumping ground for widgets
  components/
    …                          # Every non–Next-file UI module for this route
```

**`loader.ts`:** server-only async functions and types for **`page.tsx`** (**`load…`**, **`resolve…`**, metadata helpers)—**[Page server loaders](../SKILL.md#page-server-loaders-loaderts)** in the skill hub. Name the file exactly **`loader.ts`** and colocate it with **`page.tsx`**; do not use bespoke **`\*-page-data.ts`** filenames.

**Non-component `*.ts`** helpers (constants, **`@dnd-kit`** wiring without JSX if split out) **may live** beside **`page.tsx`**
at **`<page-route>/`**, under **`<page-route>/components/...`** as **`utils.ts`**, or next to a feature folder sibling—follow **[util-placement.md](./util-placement.md)** for when to use **`utils.ts`** vs **`src/lib/<name>.ts`**; **`*.tsx`** route UI belongs only under **`components/`**.

```tsx
// page.tsx
import { BoardView } from './components/board-view/board-view'
import { ListView } from './components/list-view/list-view'
import { CreateIssueDialog } from './components/create-issue-dialog'
```

#### Feature subfolders under `components/`

Use **`components/feature-name/`** when one surface pulls in **multiple private files** (main module + helpers, cards,
local hooks colocated only with that UI):

```
src/app/app/…/[projectId]/
  page.tsx
  layout.tsx
  components/
    board-view/
      board-view.tsx           # Primary export: BoardView
      draggable-issue-card.tsx # Only consumed by BoardView → stays here
    list-view/
      list-view.tsx
    create-issue-dialog.tsx    # Small, standalone → single file directly under components/
```

Issue rows reused across routes (for example **`IssueListRow`**) belong under **`src/components/issue-list-row/`** (for example **`issue-list-row.tsx`**), imported as **`@/components/issue-list-row`** — not under **`list-view/`** alone.

**Do not** place `board-view.tsx`, `create-issue-dialog.tsx`, etc. at **`page-route/`** beside **`page.tsx`**—those paths
must be **`page-route/components/...`**.

### Nested routes (deep colocation)

For **`issue/[issueId]/`** (and any nested segment), route UI lives under **that segment’s** `components/` directory:

```
src/app/app/…/[projectId]/issue/[issueId]/
  page.tsx
  layout.tsx
  components/
    issue-attachments.tsx
    issue-actions-menu.tsx
    create-comment.tsx
    comment.tsx
    …
```

Anything here stays **issue-detail-only**. If the same UI is reused on board cards later, lift to **`src/components/`**
(or a shared **`[projectId]/components/`** module if board + detail both need it—not under **`issue/[issueId]/`** only).

### Client-only pass-through siblings

Do **not** stack a route file that only forwards props into a second file when **one** parent imports the child. Merge into one module or use **non-exported** inner components — full rules, file-layout examples, and checklist: **[refactoring-principles.md](./refactoring-principles.md#client-container-only-siblings-merge-do-not-stack)**.

---

## Rules of thumb

### Colocation

- **Page-specific**: **`<page-route>/components/**`** (`./components/feature.tsx` or `./components/feature/file.tsx`).
  Imports from **`page.tsx`** are always `./components/...`, never **`./feature`** at the segment root beside **`page.tsx`**.
- **Multiple pages**: `src/components/` (or a domain package only if you already use that pattern—but default is flat under
  `src/components/`).

**Example:** `CreateIssueDialog` only opens from Project page → **`[projectId]/components/create-issue-dialog.tsx`**, not
`components/ui`.

**Counter-example:** Putting `IssueStatusBadge` **only under** `[issueId]/components/` when list **and** board **and**
settings **all** need it → lift to **`src/components/`** (for example **`issue-status-badge.tsx`**).

### When to introduce a **`feature/`** subfolder

Create **`components/feature-name/`** (always under **`components/`**, never at **`page.tsx` sibling level**) when **any** of these hold:

- Two or more **non-trivial helpers** belong exclusively to one parent surface.
- You want **namespaced folders** (`board-view/board-view.tsx`, `draggable-issue-card.tsx`) instead of five flat files loose under **`components/`**.
- A future refactor might bundle tests, mocks, or `feature-types.ts` next to the UI.

Stick to a **single file** (`components/create-issue-dialog.tsx`) while the dialogue is modest and standalone—still under **`components/`**, just not nested in **`feature/`** subfolders.

### Component naming convention

| Scope           | Filename         | JSX identifier             |
| --------------- | ---------------- | -------------------------- |
| Anything custom | `kebab-case.tsx` | `PascalCase` (`BoardView`) |

One **primary UI component per file** is the baseline. Small **private helpers** (`function PreviewRow(...)`) may live below
the main export until they warrant their own file.

### Export style

- **`src/components/ui/*`**: **named exports** only (follow shadcn-style re-exports, e.g. `export { Button, buttonVariants }`).
- **App / route modules** (**`<page-route>/components/**`): Prefer **named export for the primary component**
  (`export function BoardView`) so imports read `import { BoardView } from './components/board-view/board-view'`. If your
  segment standardizes **`export default`** for the primary component instead, stay consistent across that segment.
- Avoid files that secretly export unrelated “kitchen sink” widgets—split files instead.

### UI components (`src/components/ui`)

They are **primitives**: no workspace/project mutations, no “fetch this project ID” coupling. Compose them upward into route
containers that hold business logic (`useMutation`, TanStack Query, etc.), per AGENTS conventions.

---

## Worked examples

### Example 1 — Prefer colocation until the second caller

Situation: you build drag handles that only `<BoardView />` knows about.

✅ Initially keep `drag-overlay.tsx` or draggable card modules **inside** **`components/board-view/`** beside **`board-view.tsx`**.

❌ After one usage, inventing `@/components/draggable-issue-card` slows navigation and hides usage context.

✅ Later, list view wants the exact same draggable card behavior → lift to `src/components/draggable-issue-card.tsx`
(or similar shared path) **after** duplication is confirmed.

### Example 2 — Thin page, fat feature module

❌ **`page.tsx` with 900 lines** of JSX, keyboard handlers, conditional columns.

✅ **`page.tsx`**: `generateMetadata`, data fetch helpers, breadcrumbs, chooses `BoardView | ListView` from props/searchParams.

✅ **`components/board-view/board-view.tsx`**: sorting state, `@dnd-kit` wiring, column layout.

Boundary: persistence and API calls belong in hooks or callers; primitives stay dumb.

### Example 3 — Dialog just for this route tree

✅ `[projectId]/components/create-issue-dialog.tsx`.

❌ `@/components/create-issue-dialog` until another route genuinely opens the same mutation + copy.

### Example 4 — Settings tab under project

`/project/[projectId]/settings/page.tsx` composes `GeneralSettings`, `ListsSettings`, etc.

✅ Put those modules under **`settings/components/`**, e.g. **`settings/components/general-settings.tsx`**;
use **`settings/components/feature/`** folders when multiple files accumulate for one tab.

❌ Scatter form sections straight into **`src/components/`** unless another route genuinely reuses them.

### Example 5 — Shell owned by one workspace layout

`AppShell`: used **only** from **`src/app/app/[workspaceSlug]/layout.tsx`** (URLs under **`/app/[workspaceSlug]/...`**).

✅ Keep the shell bundle under **`[workspaceSlug]/components/app-shell/`** with dependents colocated (**`AppShellUserMenu`**, **`AppShellWorkspaceSwitcher`**, **`useAppShellSync`**, etc.), imported from **`./components/app-shell/app-shell`** in that layout.

❌ Parking it under **`src/components/app-shell`** when no other subtree imports it—or mounting **`AppShell`** again inside **`project/[projectId]`** layouts.

### Example 6: Sub-issues in one section file

✅ / ❌ walkthrough and directory layout — see **[refactoring-principles.md — Worked example](./refactoring-principles.md#worked-example-sub-issues-in-one-section-file)**.

---

## Anti-patterns (quick checklist)

- **Single-use server-only wrappers** — a **`details-body.tsx`** that only stitches together other **`page.tsx` imports** with no second caller or named subtree; keep that JSX on **`page.tsx`** (see **[Server-only shallow wrappers](./refactoring-principles.md#server-only-shallow-wrappers)** in **`refactoring-principles.md`**).
- **Shared folder for first use** — `src/components/for-one-page-only.tsx`.
- **Route-relative imports crawling `../../../`** too many times — refactor folder shape or alias shared slices.
- **Business logic leaking into `ui/`** — `Button` should not fetch.
- **Route widgets beside `page.tsx`** — **`board-view.tsx`**, **`create-issue-dialog.tsx`**, etc. must live under
  **`./components/`** for that route segment.
- **Client container stacking** — one route file that only queries or passes props into a second file that holds all behavior, with a **single** parent caller (**`section` → `list`**); merge into one module or use non-exported inner components — **[refactoring-principles.md](./refactoring-principles.md#client-container-only-siblings-merge-do-not-stack)**.
- **Ambiguous filenames** (`utils.tsx`, `stuff.tsx`) — name after user-facing feature or dominant component.

Use this checklist when reviewing PRs touching `src/app` or shared components.
