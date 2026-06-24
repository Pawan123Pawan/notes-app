# Page metadata

Every **`page.tsx`** under **`src/app/`** must export a Next.js **`metadata`** object (from **`next`**) with at least:

- **`title`** — short, human-readable document title (browser tab / SEO).
- **`description`** — one or two sentences summarizing the page for SEO and link previews.

Use **`export const metadata: Metadata`** (or **`generateMetadata`** when the title or description depends on dynamic data). Match the tone of existing routes: prefer clear, product-focused copy over internal codenames.

When you add a new route, add **`metadata`** in the same **`page.tsx`** as the default export — do not leave new pages without a title and description.

Share lookups with **`loader.ts`** when practical — see **[refactoring-principles.md — Page server loaders](./refactoring-principles.md#page-server-loaders-loaderts)** and **[SKILL.md — Page server loaders](../SKILL.md#page-server-loaders-loaderts)**.
