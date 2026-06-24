# Dates and time (dayjs)

Import **`dayjs` only from `@/lib/dayjs`** (or **`src/lib/dayjs.ts`**). That module is the shared instance: it extends the base **`dayjs`** with the plugins this app uses (see that file for the current list).

Do **not** import **`dayjs`** directly from **`dayjs`** in application code, and do **not** call **`dayjs.extend(...)`** in random modules — add new plugins in **`src/lib/dayjs.ts`** once so every caller gets them.
