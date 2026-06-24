# Utility and route-local hook placement

Where to put **pure helpers** (non-React **`utils.ts`** modules: grouping, transforms, predicates, formatting) and **route-scoped React hooks** (**`use-*.ts`** beside **`utils.ts`**)—mirrors **colocate first**, then lift when reuse is proven.

See the skill hub [`../SKILL.md`](../SKILL.md) and **[component-structure-and-routing.md](./component-structure-and-routing.md)** for UI module layout; this document covers **`utils.ts`**, segment-local **`use-*.ts`** modules, **`src/lib/`**, and **`src/hooks/`** promotion.

---

## Guiding principle

1. **Scope utilities and segment-local hooks to their consumer** — if a helper (**`utils.ts`**) or **duplicate-query hook** (**`use-*.ts`**) is only used under one **route segment** / **`components/`** subtree, keep it in the **narrowest folder** that contains every importer (often **`components/use-<domain>.ts`** beside **`components/utils.ts`**).
2. **Promote to `src/lib/`** (pure helpers) or **`src/hooks/`** (hooks) only when **unrelated** features or distant routes need the same module—not on speculation.

Wrong direction: moving helpers to **`src/lib/`** early, promoting **`use-*.ts`** to **`src/hooks/`** before an **unrelated** route needs it, or scattering one-off **`helpers.ts`** at repo root segments when a single **`utils.ts`** beside the importer would suffice.

---

## Route and component colocation (`utils.ts`)

| Consumer                                                                 | Typical location                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **One component file** under **`<page-route>/components/`**              | **`utils.ts` alongside that file**, or **`utils.ts` in the component’s folder** if the feature splits into siblings (e.g. `board-view/utils.ts`). |
| **Several modules**, same **segment** / same **`components/feature/`**   | **`utils.ts` at** the folder that owns all call sites—the **narrowest folder** whose subtree contains every importer.                                     |
| **Segment-wide** helpers (used by **`page.tsx`** and multiple children) | **`<page-route>/utils.ts`** at the segment root (next to **`page.tsx`**) is acceptable when **`components/`** is not the only consumer.                                           |

Prefer the name **`utils.ts`** over ad-hoc names (**`helpers.ts`**, **`tools.ts`**) unless the project folder already establishes a local convention.

Constants-only files may stay **`constants.ts`**; if logic and constants are tiny, **`utils.ts`** can hold both—avoid gratuitous splitting.

---

## Route-colocated hooks (`use-*.ts`)

**React hooks** that bundle TanStack Query / tRPC (**`useMutation`**, **`useQuery`**, **`queryFilter`**, optimistic **`queryClient`** updates, etc.) for **one route segment** follow the **same narrowest-folder rule** as the **`utils.ts`** section above.

| Consumer                                                                 | Typical location                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Several sibling modules** under **`project/…/components/`** sharing identical mutation options | **`use-<feature>.ts`** as a sibling of **`utils.ts`** in that **`components/`** folder—the same narrowest parent shared by **`utils.ts`**. Example: **`use-reorder-project-issue.ts`** imported by **`board-view/board-view.tsx`** and **`list-view/list-view.tsx`**. |
| **One feature subfolder only**                                           | **`use-<feature>.ts`** inside that folder (same pattern as **`utils.ts`** living in **`board-view/`** when only **`board-view`** imports it).    |

**Naming**

- **Filename:** **`use-<kebab-domain>.ts`** (matches **`src/hooks/use-*.ts`** style).
- **Export:** **`useCamelCase`** for the hook (**`useReorderProjectIssueMutation`**).

**Promotion**

When **two or more unrelated route subtrees** need the same hook, move it to **`src/hooks/use-<domain>.ts`** — align with **[Shared hooks for the same query](./data-fetching.md#shared-hooks-for-the-same-query-and-derived-data)** (`data-fetching.md`). Until then, keep hooks beside **`utils.ts`** so **`src/hooks`** does not accumulate segment-specific glue.

Hooks must live in **`'use client'`** files when they call React Query / browser-only APIs.

---

## Shared library (`src/lib/<name>.ts`)

When the **same helpers** appear in multiple **unrelated** route trees or cross-cutting domains, move them under **`src/lib/`** using a **domain-oriented file name**:

- **`src/lib/<util-name>.ts`** — **`util-name`** is the **concept** shared by the exports (nouns/features), **not** a grab-bag **`utils.ts`** at lib root.

**Examples:**

- `groupIssues`, `sortIssuesByUpdatedAt`, `issuePreviewLabel` → **`src/lib/issues.ts`** (multiple related helpers in one module with named exports).
- One narrowly scoped function used app-wide (`formatRelativeDeadline`) → still pick a cohesive file (**`dates.ts`**, **`deadlines.ts`**, **`relative-time.ts`**) rather than dumping into a monolithic **`lib/utils.ts`** unless your team already standardized that pattern.

Prefer **additive moves**: copy up to **`src/lib`** when the **second unrelated caller** appears, then delete the duplicated colocated **`utils`** re-export stub if needed.

---

## Checklist before lifting to `src/lib/`

1. Are there **two or more** call sites outside the original route/feature folder?
2. Does the proposed **`src/lib/<name>.ts`** name describe **all** exported helpers in that file?
3. If the file grows large, split by **subdomains** (**`issues-filter.ts`** vs **`issues-mutations.ts`**) rather than dumping unrelated domains into one file.

---

## Related

- **Component colocation**: [component-structure-and-routing.md](./component-structure-and-routing.md)
- **`useEffect`**-free patterns for “when to derive vs util”: [`../../no-use-effect/SKILL.md`](../../no-use-effect/SKILL.md)
