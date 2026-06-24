# Refactoring principles

When **moving**, **splitting**, **renaming**, or **collapsing** presentation modules under **`src/app/**`** or **`src/components/**`**, use this file as the single checklist. The skill hub **[`../SKILL.md`](../SKILL.md)** links here so agents can load one reference instead of hunting across the hub.

**Related:** placement and folders — **[component-structure-and-routing.md](./component-structure-and-routing.md)**; **`loader.ts`** (server page data) — **[SKILL.md — Page server loaders](../SKILL.md#page-server-loaders-loaderts)**; **`utils.ts`** / **`use-*.ts`** — **[util-placement.md](./util-placement.md)**; cache and mutations — **[data-fetching.md](./data-fetching.md)**.

---

## Refactoring workflow

When you refactor a component (move it to the correct route **`components/`** tree, split an oversized module, or extract helpers):

1. **Apply placement rules first** — route-only UI under **`<page-route>/components/`**; keep **`src/components/`** only for primitives or UI shared across unrelated routes (full detail in **[component-structure-and-routing](./component-structure-and-routing.md)**).
2. **Inspect the module body for nested UI — do not lift-and-shift only** — before or during a move, read the file you are touching end-to-end. Identify **child components** already defined in that module (**non-exported `function` / `const` components**, large JSX regions that behave like distinct widgets, or sections that repeat patterns). **Relocating** a big file into **`components/`** without this pass is incomplete: you may have only renamed the folder while leaving an oversized, poorly scoped module. For each nested piece, decide whether it becomes a **named sibling file** (**kebab-case.tsx**, PascalCase export), stays a **non-exported helper** in the parent (see **[Client container-only siblings](#client-container-only-siblings-merge-do-not-stack)** when it would be a single-use pass-through), or lifts to **`src/components/`** when a **second route** needs it. Apply **[Inline simple form fields](../SKILL.md#inline-simple-form-fields-avoid-field-micro-components)** only where the hub says to duplicate small **`Field` + `Controller`** blocks — do not treat “nested component” as mandatory extraction for every repeated field row; **do** extract when there is a **clear subtree boundary** (dialog body, settings section, list row, chart shell). Then move or split those files according to **[component-structure-and-routing](./component-structure-and-routing.md)** so **each file owns one primary export** (plus local helpers), not a pile of anonymous inner components after the move.
3. **Walk its import graph** — open every **local / app-local** module that component imports (same feature, **`@/components/...`** owned by the product, co-located **`utils.ts`** / **`use-*.ts`** / helpers per **[util-placement](./util-placement.md)**). For each dependency, decide whether it still belongs next to the caller after the move (split into the same feature folder, lift to shared **`src/components/`**, or leave inline).
4. **Repeat until stable** — continue recursively for newly touched modules until **no dependency** still violates placement or folder structure (e.g. a stray **`*.tsx`** beside **`page.tsx`**, server fetch logic that belongs in **`loader.ts`** per **[Page server loaders](#page-server-loaders-loaderts)**, or a monolithic file that should be a **`components/feature/`** folder). Stop at clear boundaries: **`src/components/ui/*`**, **`node_modules`**, framework libs.
5. **Collapse single-caller client wrappers** — if **`A.tsx`** only forwards props into **`B.tsx`** and **`page.tsx`** (or **`A`**) is the only importer of **`B`**, merge **`B`** into **`A`** as non-exported helpers unless **`B`** is a dedicated **`*-form.tsx`** surface or other **primitive leaf** — see **[Client container-only siblings](#client-container-only-siblings-merge-do-not-stack)** below.
6. **Stable imports vs. pointless barrels** — when splitting a **widely imported** module under **`@/components/...`**, a barrel **`index.ts`** at the old path can keep many external call sites stable. When splitting **route-local** UI under **`src/app/.../<page-route>/components/`**, **do not** add a file whose **only** job is to re-export siblings (**`export { Foo } from './foo'`** with no logic). Update **`page.tsx`** / **`layout.tsx`** to import each concrete module (**`./components/members-tab-content`**, etc.) instead — see **[Re-export-only route barrels](#re-export-only-route-barrels)**.

Use this checklist whenever a task says “refactor” a UI module, not only when adding new routes.

---

## Page server loaders (`loader.ts`)

**Colocate server data loading with the route segment that owns `page.tsx`.**

1. **Create or extend `loader.ts`** in the **same directory** as **`page.tsx`** for that segment (e.g. **`src/app/app/[workspaceSlug]/project/[projectId]/page.tsx`** → **`…/project/[projectId]/loader.ts`**). Use the fixed name **`loader.ts`**—do not introduce parallel names such as **`*-page-data.ts`**, **`issue-detail-page-data.ts`**, or **`*-page-loaders.ts`**.
2. **Move** async work out of **`page.tsx`**: **`getCurrentSession`**, **`redirect`** / **`notFound`**, workspace/project/issue resolution, tRPC/service calls, and any **`generateMetadata`** lookup that duplicates that resolution. Export **one primary “page payload”** function per concern where it helps (**`loadProjectDetailsPage`**, **`resolveIssuePageData`**, **`loadWorkspaceMembersPage`**, …) plus **metadata helpers** (**`resolveProjectDetailsMetadata`**, **`resolveWorkspaceHomeMetadata`**) that return **`title` / `description`** (or a small object **`page.tsx`** maps to **`Metadata`**).
3. **Keep in `page.tsx`**: **`metadata` / `generateMetadata`**, **`PageContainer`**, **`Breadcrumb`**, **`PageHeader`**, wiring **`./components/...`**, and passing loader results as props—no duplicate service calls unless **`generateMetadata`** must stay independent (then shared logic stays in **`loader.ts`** and both entry points call the helper).
4. **Imports:** **`page.tsx`** uses **`import { … } from './loader'`**. Segment **`utils.ts`** may **`import type`** from **`./loader`** when types come from the loader’s return type. **Do not** import **`loader.ts`** from **`components/`** for data; the server page (or layout) owns fetching and passes props.
5. **Stack with thin `page.tsx`:** extracting loaders does **not** replace the rule against **server-only shallow wrappers** that only stitch JSX—see **[Server-only shallow wrappers](#server-only-shallow-wrappers)**. **`loader.ts`** is for **data and navigation side effects**, not for moving presentational trees into a second server file without a second caller.

When you touch a **`page.tsx`** that inlines server fetches, prefer **moving** that logic to **`loader.ts`** as part of the same change set so conventions stay consistent.

---

## Server-only shallow wrappers

**Do not** introduce a separate **server** component whose only job is to paste together other imports for **`page.tsx`**, when:

- **`page.tsx`** and that component are **both** async / server components (no **`'use client'`** boundary between them), and
- There is **exactly one** importer (typically **`page.tsx`**), and
- The wrapper does not **name a reusable concept** (shared layout, tab shell, story, test, second route).

In that case the “container” adds **indirection and navigation cost** without an RSC benefit: keep the markup and **one-off** `const timeline = …` style derivations **in `page.tsx`** (or in the **actual** parent server layout if several sibling pages share it).

**Still extract** when it earns its file:

- **Real repetition** (same JSX used from **`page.tsx`**, a **`layout.tsx`**, and a modal route), or a **second caller** elsewhere.
- **Sharp boundary** for ownership (e.g. **`issue-activity-timeline.tsx`** owns comment vs activity rows and stays focused).
- **Size**: a **very large** `page.tsx` may use a server child to cap file length — prefer naming that module after the **subtree** it represents (**`issue-activity-timeline`**, **`project-settings-general`**), not a generic **`details-body`**.

This stacks with **thin `page.tsx`**: thin means **chrome + composition**, not **every** multi-column grid must be a sibling file.

---

## Client container-only siblings (merge, do not stack)

Do **not** add a route module whose **only** job is to wrap another route module that already defines the same screen slice, when a **single** parent composes them and **nothing else** imports the child (for example **`SubIssuesSection` → `SubIssuesList`** where the section only runs **`useQuery`** and forwards props).

- **Why:** duplicated prop types, extra hops in the tree, no reuse boundary; extra file and prop surface with no second caller.
- **Do instead:** one **exported** component in **`something-section.tsx`**; move list / DnD / overlay / mutations into **non-exported** functions in the **same file** (inner component + **`key`** remount pattern when local order must reset). Keep a **separate** file only when the second module is a **real leaf** (**`add-*-form.tsx`**, a draggable card, a dialog) or has a **second** importer.

**Canonical layout**

```
components/sub-issues/
  sub-issues-section.tsx    # export { SubIssuesSection }; private SortableSubIssueRow + SubIssuesReorderSurface
  add-sub-issue.tsx
```

**Avoid**

```
components/sub-issues/
  sub-issues-section.tsx    # only query + <SubIssuesList … />
  sub-issues-list.tsx       # all DnD + rows—single caller only
```

This differs from **`board-view/`** + **`draggable-issue-card.tsx`**: the card is a **focused leaf** (presentation + one draggable boundary), not a pass-through container that duplicates the parent’s responsibility.

### Worked example: Sub-issues in one section file

Situation: **`SubIssuesSection`** loads sub-issues and **`SubIssuesList`** (same folder) owns **`@dnd-kit`** sortable rows and reorder mutations—**`SubIssuesSection`** is the only importer.

✅ Merge into **`sub-issues-section.tsx`**: exported **`SubIssuesSection`**; non-exported **`SubIssuesReorderSurface`** (mounted with **`key={…}`** so client ordering resets when the query updates) plus **`SortableSubIssueRow`** helpers. **`add-sub-issue.tsx`** stays a separate **`*-form` / composer** module.

❌ Keep **`sub-issues-list.tsx`** as a thin container that only receives **`subIssues`** and renders the drag layer.

---

## Re-export-only route barrels

**Do not** introduce a **`components/*.tsx`** or **`components/index.ts`** that only aggregates **`export { X } from './x'`** when the **only** consumers are **`page.tsx`** / **`layout.tsx`** in the same route segment.

- **Why:** extra file and jump-to-definition hop; no shared package boundary (unlike a **`@/components/...`** entry many routes import).
- **Do instead:** **`page.tsx`** imports **`./components/members-tab-content`**, **`./components/invite-dialog`**, and other leaves directly.

**Barrels are still appropriate** when many unrelated routes depend on a stable **`@/components/<feature>`** path or you are intentionally defining a **public submodule API** — not as the default for every App Router **`components/`** split.

---

## Anti-patterns (refactor review)

- **Lift-and-shift without decomposition** — moving a large **`*.tsx`** into **`components/`** (or renaming it) **without** auditing **nested components** and subtree boundaries inside that file; you should extract or relocate inner UI per **[Refactoring workflow](#refactoring-workflow)** step 2, not stop at a single-file move.
- **Single-use server-only wrappers** — a **`details-body.tsx`** that only stitches together other **`page.tsx`** imports with no second caller or named subtree; keep that JSX on **`page.tsx`** — see **[Server-only shallow wrappers](#server-only-shallow-wrappers)**.
- **Client container stacking** — one route file that only queries or passes props into a second file that holds all behavior, with a **single** parent caller (**`section` → `list`**); merge into one module or use non-exported inner components — see **[Client container-only siblings](#client-container-only-siblings-merge-do-not-stack)**.
- **Re-export-only route barrels** — a thin **`*-client.tsx`** or **`index.ts`** that only re-exports sibling modules while **`page.tsx`** is the sole importer — wire **`page.tsx`** to each concrete file instead — see **[Re-export-only route barrels](#re-export-only-route-barrels)**.

For broader placement anti-patterns (route widgets beside **`page.tsx`**, shared folder for first use, etc.), see **[Anti-patterns](./component-structure-and-routing.md#anti-patterns-quick-checklist)** in **`component-structure-and-routing.md`**.
