# UI and client data

Product UI conventions for **`src/app/**`** and **`src/components/**`**: forms, mutations, workspace page chrome, and
client-cache patterns.

**Related**

- **Hub:** [`../SKILL.md`](../SKILL.md) — **`loader.ts`**, React Hook Form instance shape, **`triggerRouteProgressStart`**,
  data-fetching refs.
- **Repo root:** [`../../../AGENTS.md`](../../../AGENTS.md) — tRPC, workers, Drizzle (non-frontend sections).

Keep the **[`SKILL.md`](../SKILL.md)** topic index aligned when rules here move or split.

---

## Forms

- **Forms:** use **`react-hook-form`** with **Zod** schemas and **`zodResolver`** from **`@hookform/resolvers`** for validation in any form component. Prefer **`useForm`** + **`Controller`**, **`handleSubmit`**, **`formState.errors`**, and **`noValidate`** on the `<form>` so browser defaults do not fight schema messages. Surface field errors with **`Field`**, **`FieldError`**, **`data-invalid`**, and **`aria-invalid`** as in the auth forms under **`src/app/(login)/`**.

- **Input and Textarea wiring:** for **`Input`** and **`Textarea`** components, use **`Controller`** from `react-hook-form` and **do not use `register`**.

- **Multiline autoresize:** when editable text can wrap to multiple lines (long titles, inline descriptions, or any **`input`** replacement that risks horizontal scroll/clipped content), use **`AutoresizableTextarea`** from **`src/components/ui/autoresizable-textarea.tsx`** instead of **`Input`** or a plain **`textarea`**. It adjusts height from **`scrollHeight`** on change so users are not trapped in a scrolling single-line field (avoid relying on **`field-sizing`** for portability).

- **React Hook Form watchers:** prefer **`useWatch`** over **`watch`** from `useForm()`. `watch` is not memoization-safe with the React Compiler and can cause compiler skips or stale UI risks when values flow into memoized code.

- **Selects:** do **not** use the native **`<select>`** element. Use **`Select`**, **`SelectTrigger`**, **`SelectValue`**, **`SelectContent`**, and **`SelectItem`** from **`src/components/ui/select.tsx`**. With **`react-hook-form`**, wire the value with **`Controller`** (**`value`** / **`onValueChange`**) or an equivalent pattern — native **`register`** does not apply to Radix **`Select`**.

- **Boolean toggles:** use **`Switch`** from **`src/components/ui/switch.tsx`** for on/off settings (especially in settings pages). Do not build custom switch-like buttons for toggle controls unless there is a documented exception.

---

## Buttons and mutations

- **`Button` (`src/components/ui/button.tsx`)** exposes a **`loading`** prop. Set **`loading={true}`** whenever an action is in progress — e.g. while a **TanStack Query mutation** is pending (`mutation.isPending`), or any other async work that should disable the control and show the spinner. Prefer that over bespoke “Submitting…” copy only. Use **`BaseButton`** when you need **`asChild`** (e.g. rendering as a `Link`); `Button` does not support `asChild`.

- **Mutations and POST-style requests:** use **`@tanstack/react-query`** **`useMutation`** for server mutations and API **`POST`** calls (and similar imperative requests). Rely on **`isPending`**, **`isError`**, **`error`**, and **`isSuccess`** from the mutation instead of hand-rolled **`useState`** for pending and error fields. The app wraps the tree with **`QueryProvider`** in `src/app/layout.tsx`.

- **Mutation errors:** for every **`useMutation`** call, handle failures with **`onError`** and call **`showErrorToast(title, error, defaultMessage?)`** from **`src/lib/utils.ts`** (title first, error second) so users always see a toast with a clear title and resolved error message.

- **Client-owned lists and instant UI:** when a **small slice of data** on a server-rendered page updates from **client mutations** (for example issue attachments, reactions, or another list users add/remove in place), do **not** rely on **`router.refresh()`** to show the change — it **re-fetches the whole RSC tree** and usually feels slow. Add a **tRPC `query`** that returns that slice (or reuse one), render it with **`useQuery`** and hydrate from the page with **`initialData`** from server props. On **create**, **optimistically** **`setQueryData`** (or append using data you already have, such as upload API metadata), then **`invalidateQueries`** on **`onSettled`** so the cache matches the server. On **delete**, use **`onMutate`** to remove from the cache, stash **`previous`**, and **rollback** in **`onError`**. Keep **`router.refresh()`** for cases that truly require the full page tree (navigation, permissions, or many server-only fields).

- **Irreversible destructive actions:** when an action permanently removes data/entities (e.g. delete/remove account, member, workspace, invitation), require an explicit confirmation step using the primitives in **`src/components/ui/alert-dialog.tsx`** (`AlertDialog`, `AlertDialogContent`, `AlertDialogAction`, `AlertDialogCancel`, etc.) before executing the mutation.

---

## Settings and workspace page chrome

- **Settings surface consistency:** in settings pages (for example under **`src/app/app/[workspaceSlug]/settings/`**), render configurable groups using **`Card`** primitives from **`src/components/ui/card.tsx`** (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`) instead of ad-hoc heading/paragraph wrappers, so section presentation stays uniform.

- **Page header consistency:** for any newly created page-level component that needs a title/description header (for example dashboard, settings, notifications, members, and similar screens), use **`PageHeader`** from **`src/components/ui/page-header.tsx`** instead of custom `<h1>` + `<p>` wrappers. Pass any top-right action controls via the `extraAction` prop.

- **Page container consistency:** for workspace page-level layouts, use **`PageContainer`** from **`src/components/ui/page-container.tsx`** as the outer wrapper. It standardizes responsive spacing and padding (`gap-4` on mobile, `sm:gap-8`, `p-4`, `sm:p-6`), so avoid duplicating these classes on ad-hoc wrappers.

- **Workspace breadcrumbs:** on workspace pages under **`src/app/app/[workspaceSlug]/`**, render a breadcrumb using primitives from **`src/components/ui/breadcrumb.tsx`** **above** the `PageHeader` component (never inside `PageHeader` props). Include a link back to **`/app/{workspaceSlug}`** labeled “Workspace Home”; the current page should be the terminal breadcrumb item.

- **Tabbed page deep links:** when a page uses tabs (for example with `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent`), provide a deep link for each tab using a query param (for example `?tab=members`). Use tab links (`TabsTrigger asChild` + `Link`) instead of local-only tab state so URLs are shareable and refresh-safe. Define and validate allowed tab values, and default to the primary tab when the query param is missing or invalid.

### Example (breadcrumb + headers)

```tsx
<PageContainer>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href={`/app/${workspaceSlug}`}>Workspace Home</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Settings</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>

  <PageHeader
    title="Settings"
    description="Manage your profile, security, and preferences."
  />
</PageContainer>
```
