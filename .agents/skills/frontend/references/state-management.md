# State management in frontend modules

Thin rules for **`src/app/**`** and **`src/components/**`** so local state stays purposeful and predictable.

---

## Prefer form-owned values when they belong to the form

If a piece of UI state is:

- Driven by controls **inside** the same **`<form>`** as **`react-hook-form`**, or
- Logically **part of submitting or editing that dialog or form surface** (e.g. affects what happens after submit)

then **model it as a form field**: add it to your Zod form schema (or a dedicated client-only schema fragment), **`defaultValues`**, and **`Controller`** (or **`useWatch`** when read-only derivation is enough). Avoid a parallel **`useState`** that duplicates the same toggle or input.

Fields that **do not** go to the server (e.g. “Create more”, “stay open”) still belong on the form: exclude them when you build the tRPC/API payload—they share **`reset`**, **`getValues`** before resets, and a single source of truth with the submit surface.

Reserve **`useState`** (and similar) when the value is **not** really part of that form lifecycle—for example forcing remounts with a **key** counter, ephemeral UI not tied to **`mutate`** input (**“uploading spinner only”** is better driven by primitives’ **`loading`** merged onto **`trigger`**), or **dialog open** flags owned elsewhere (e.g. a store).

---

## Staging server-backed values and submit barriers

### Staging payloads that become API fields later

Flows such as **“pick files → upload → receive rows with **`id`**s → submit create with **`attachmentFileIds`**”** should keep **staging data on the same **`useForm`** surface** whenever those values must stay consistent through **submit** / **reset**:

- Prefer a form field typed to the upload response (**or**) a normalized shape that preserves **`id`** **and** preview metadata (**name**, **`contentType`**, **`sizeBytes`**, …).
- **Derive** wire-format fields **inside** **`handleSubmit`**: **`attachmentFileIds: values.attachments.map((row) => row.id)`** instead of trusting a disconnected **`useState`** list that might drift after **`reset`** / partial failures.

Reserve **`useState`** for uploads only when staging is intentionally **outside** submission (otherwise you fork state with **`react-hook-form`**).

### Submit barriers (“honest” submit surfaces)

Secondary async steps that **must finish** before the primary **`mutateAsync`** carries the right identifiers—attachment upload yielding **`fileIds`**, prerequisite token exchanges, similar—need an explicit barrier:

1. **Submit `Button`:** set **`disabled`** while the secondary step is pending (**`true`** from **`onUploadStartAction`**, cleared on **`onUploadCompleteAction` / `onUploadErrorAction`** pairs with mutation **`isPending`**, whichever you standardize).
2. **Form `onSubmit`:** if a barrier flag is set, **`preventDefault()`** and return **before** **`form.handleSubmit(...)`**, so **`Enter`** cannot bypass **`disabled`**.
3. **Reset / dialog close:** clear the barrier alongside **`reset()`** so callers do not reopen with a stuck “busy” flag.

Primitives that encapsulate uploads should expose lifecycle callbacks (**start**, **complete**, **error**) so the route drives the barrier without reading internal **`mutation.isPending`** — see **`[Encapsulated UI](./data-fetching.md#encapsulated-ui-mutations-and-orchestration-callbacks)`**.

---

## Align with other rules

- **`useForm`** as **`const form`**, **`Controller`**, and **`useWatch` over `watch`**: **`SKILL.md`** hub and **`ui-and-client-data.md`**.
- Avoid **`useEffect`** for syncing duplicate state—derive or handle in events: **[`../../no-use-effect/SKILL.md`](../../no-use-effect/SKILL.md)**.
- URL-owned state belongs in **`nuqs`**: **[`../../nuqs/SKILL.md`](../../nuqs/SKILL.md)**.

When you add rules here, keep the **`SKILL.md`** topic index accurate.
