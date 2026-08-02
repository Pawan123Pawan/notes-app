<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
skills:
  - task: "Anything tRPC — where to start (routers, procedures, adapters, client, errors)"
    load: "node_modules/@trpc/server/skills/trpc-router/SKILL.md"
  - task: "tRPC server — initTRPC, routers, procedures, context, merging routers"
    load: "node_modules/@trpc/server/skills/server-setup/SKILL.md"
  - task: "tRPC on Next.js, edge, or fetch runtimes"
    load: "node_modules/@trpc/server/skills/adapter-fetch/SKILL.md"
  - task: "tRPC client — createTRPCClient, links, headers/auth, transformers"
    load: "node_modules/@trpc/client/skills/client-setup/SKILL.md"
  - task: ".env files, secrets, loading env in Node"
    load: "node_modules/dotenv/skills/dotenv/SKILL.md"
  - task: "Mongoose models, MongoDB connection, Better Auth database adapter"
    load: ".agents/skills/backend/references/mongoose-mongodb.md"
<!-- intent-skills:end -->

<!-- BEGIN:app-router-routes -->
## App Router routes

- **`src/app/(landing)/`** — marketing and public website content (the landing site).

- **`src/app/(website)/`** — when designing or building pages in this route group, compose UI with shared website primitives from **`src/components/website/components/elements/`** and icons from **`src/components/website/components/icons/`** instead of ad-hoc replacements.

- **`src/app/(login)/`** — sign-up, sign-in, password reset, and other **authorization** flows. Route group only; URLs do not include `(login)`.

- **`src/app/app/`** — the **authenticated product** (`app` is a normal **route segment**, not a parenthesized group). All authenticated routes should live under this path and use URLs that start with **`/app`** (e.g. **`/app`**, **`/app/settings`**).

- **`AppShell` (`src/components/app-shell.tsx`)** — sidebar, header, and signed-in chrome for the product. Wire it **only** in **`src/app/layout.tsx`** (the root layout). Do **not** mount **`AppShell`** again in nested layouts (e.g. under **`src/app/app/`**). It is meant for **authenticated** **`/app`** usage; the component only applies that UI when the route is under **`/app`** so landing and auth routes stay unboxed. Do **not** mount **`AppShell`** in the root layout of unauthenticated routes (**`layout.tsx`**).
<!-- END:app-router-routes -->

<!-- BEGIN:page-metadata -->
## Page metadata

Every **`page.tsx`** under **`src/app/`** must export a Next.js **`metadata`** object (from **`next`**) with at least:

- **`title`** — short, human-readable document title (browser tab / SEO).
- **`description`** — one or two sentences summarizing the page for SEO and link previews.

Use **`export const metadata: Metadata`** (or **`generateMetadata`** when the title or description depends on dynamic data). Match the tone of existing routes: prefer clear, product-focused copy over internal codenames.

When you add a new route, add **`metadata`** in the same **`page.tsx`** as the default export—do not leave new pages without a title and description.
<!-- END:page-metadata -->

<!-- BEGIN:dayjs -->
## Dates and time (dayjs)

Import **`dayjs` only from `@/lib/dayjs`** (or **`src/lib/dayjs.ts`**). That module is the shared instance: it extends the base **`dayjs`** with the plugins this app uses (see that file for the current list). Do **not** import **`dayjs`** directly from **`dayjs`** in application code, and do **not** call **`dayjs.extend(...)`** in random modules—add new plugins in **`src/lib/dayjs.ts`** once so every caller gets them.
<!-- END:dayjs -->

<!-- BEGIN:ui-and-client-data -->
## UI and client data

- **Forms:** use **`react-hook-form`** with **Zod** schemas and **`zodResolver`** from **`@hookform/resolvers`** for validation in any form component. Prefer **`useForm`** + **`register`** (or **`Controller`** when needed), **`handleSubmit`**, **`formState.errors`**, and **`noValidate`** on the `<form>` so browser defaults do not fight schema messages. Surface field errors with **`Field`**, **`FieldError`**, **`data-invalid`**, and **`aria-invalid`** as in the auth forms under **`src/app/(login)/`**.

- **React Hook Form watchers:** prefer **`useWatch`** over **`watch`** from `useForm()`. `watch` is not memoization-safe with the React Compiler and can cause compiler skips or stale UI risks when values flow into memoized code.

- **Selects:** do **not** use the native **`<select>`** element. Use **`Select`**, **`SelectTrigger`**, **`SelectValue`**, **`SelectContent`**, and **`SelectItem`** from **`src/components/ui/select.tsx`**. With **`react-hook-form`**, wire the value with **`Controller`** (**`value`** / **`onValueChange`**) or an equivalent pattern—native **`register`** does not apply to Radix **`Select`**.

- **Boolean toggles:** use **`Switch`** from **`src/components/ui/switch.tsx`** for on/off settings (especially in settings pages). Do not build custom switch-like buttons for toggle controls unless there is a documented exception.

- **`Button` (`src/components/ui/button.tsx`)** exposes a **`loading`** prop. Set **`loading={true}`** whenever an action is in progress—e.g. while a **TanStack Query mutation** is pending (`mutation.isPending`), or any other async work that should disable the control and show the spinner. Prefer that over bespoke “Submitting…” copy only. Use **`BaseButton`** when you need **`asChild`** (e.g. rendering as a `Link`); `Button` does not support `asChild`.

- **Mutations and POST-style requests:** use **`@tanstack/react-query`** **`useMutation`** for server mutations and API **`POST`** calls (and similar imperative requests). Rely on **`isPending`**, **`isError`**, **`error`**, and **`isSuccess`** from the mutation instead of hand-rolled **`useState`** for pending and error fields. The app wraps the tree with **`QueryProvider`** in `src/app/layout.tsx`.

- **Mutation errors:** for every **`useMutation`** call, handle failures with **`onError`** and call **`showErrorToast(title, error, defaultMessage?)`** from **`src/lib/utils.ts`** (title first, error second) so users always see a toast with a clear title and resolved error message.

- **Irreversible destructive actions:** when an action permanently removes data/entities (e.g. delete/remove account, member, workspace, invitation), require an explicit confirmation step using the primitives in **`src/components/ui/alert-dialog.tsx`** (`AlertDialog`, `AlertDialogContent`, `AlertDialogAction`, `AlertDialogCancel`, etc.) before executing the mutation.

- **Settings surface consistency:** in settings pages (for example under **`src/app/app/[workspaceSlug]/settings/`**), render configurable groups using **`Card`** primitives from **`src/components/ui/card.tsx`** (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`) instead of ad-hoc heading/paragraph wrappers, so section presentation stays uniform.

- **Page header consistency:** for any newly created page-level component that needs a title/description header (for example dashboard, settings, notifications, members, and similar screens), use **`PageHeader`** from **`src/components/ui/page-header.tsx`** instead of custom `<h1>` + `<p>` wrappers. Pass any top-right action controls via the `extraAction` prop.

- **Page container consistency:** for workspace page-level layouts, use **`PageContainer`** from **`src/components/ui/page-container.tsx`** as the outer wrapper. It standardizes responsive spacing and padding (`gap-4` on mobile, `sm:gap-8`, `p-4`, `sm:p-6`), so avoid duplicating these classes on ad-hoc wrappers.

- **Workspace breadcrumbs:** on workspace pages under **`src/app/app/[workspaceSlug]/`**, render a breadcrumb using primitives from **`src/components/ui/breadcrumb.tsx`** **above** the `PageHeader` component (never inside `PageHeader` props). Wrap the breadcrumb and `PageHeader` in a `flex flex-col gap-4` stack so spacing between them is always **`gap-4`**. Include a link back to **`/app/{workspaceSlug}`** labeled “Workspace Home”; the current page should be the terminal breadcrumb item.

- **Tabbed page deep links:** when a page uses tabs (for example with `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent`), provide a deep link for each tab using a query param (for example `?tab=members`). Use tab links (`TabsTrigger asChild` + `Link`) instead of local-only tab state so URLs are shareable and refresh-safe. Define and validate allowed tab values, and default to the primary tab when the query param is missing or invalid.

  Example:
  ```tsx
  <PageContainer>
    <div className="flex flex-col gap-4">
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
    </div>
  </PageContainer>
  ```
<!-- END:ui-and-client-data -->

<!-- BEGIN:trpc-router-structure -->
## tRPC router structure

- Under `src/trpc/routers/`, create one `*.router.ts` file per domain that defines and exports the router, and a sibling `*.service.ts` file that contains reusable business/data-access functions.
- Call `*.service.ts` functions from router procedures and from server-only modules when the same logic is needed outside tRPC, instead of duplicating query/mutation logic.
- Keep validation schemas in sibling `*.input.ts` files so they can be imported by both server and client components when shared validation is needed.
- Avoid defining input schemas inline in router files when the schema may be reused elsewhere; import from the corresponding `*.input.ts` module instead.
- API implementation must be **tRPC-first**: create typed procedures in routers and consume them via tRPC query/mutation options instead of creating new Next.js route handlers under `src/app/**/api/**`.
- Use Next.js API route handlers only for endpoints that require non-JSON payloads (for example file uploads / multipart form data), since tRPC procedures in this project are intended for serialized JSON data.
<!-- END:trpc-router-structure -->

<!-- BEGIN:formatting -->
## Formatting

- After installing any shadcn component, run `bun format`.
- After making any codebase change, run `bun format` before finishing.
<!-- END:formatting -->

<!-- BEGIN:mongoose-schema-workflow -->
## Mongoose / MongoDB (this app)

- **Database:** MongoDB only via **Mongoose**. Do **not** add Prisma, Drizzle, PostgreSQL, or other SQL adapters.
- **Connection:** use **`connectDB()`** from **`@/db`** (`src/db/index.ts`) everywhere — app models, tRPC services, workers, and Better Auth. Do **not** create a separate **`src/lib/mongodb.ts`** or second **`MongoClient`**.
- **Better Auth:** **`mongodbAdapter`** with **`getAuthMongoDb()`** / **`getAuthMongoClient()`** from **`@/db`** (native driver handles reused from the Mongoose connection).
- **Models:** define Mongoose schemas under **`src/db/schema/`**; call **`connectDB()`** before queries in services.
- **Env:** **`DATABASE_URL`** must be a MongoDB URI (`mongodb://` or `mongodb+srv://`) — validated in **`src/lib/env.ts`**.
- **Not the database:** **`route-progress`** modules (`src/lib/route-progress.ts`, `src/hooks/use-route-transition-progress.ts`, `src/components/route-transition-progress.tsx`) are **navigation UI** for the AppShell top bar during `/app` page transitions — not Postgres or MongoDB.
- After changing any Mongoose schema, restart the dev server so models reload cleanly.
- Detail: **`.agents/skills/backend/references/mongoose-mongodb.md`**
<!-- END:mongoose-schema-workflow -->