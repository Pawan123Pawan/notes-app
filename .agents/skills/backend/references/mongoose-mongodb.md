# Mongoose and MongoDB (this app)

This project uses **MongoDB only** via **Mongoose**. Do **not** add Prisma, Drizzle, PostgreSQL, SQLite, or MySQL adapters, schemas, or connection helpers.

## Single connection

- **`connectDB()`** from **`@/db`** (`src/db/index.ts`) is the **only** database connection entry point.
- App models, services, workers, and Better Auth all share this Mongoose connection.
- Do **not** create a separate **`src/lib/mongodb.ts`** or second **`MongoClient`** for auth — use **`getAuthMongoClient()`** and **`getAuthMongoDb()`** exported from **`@/db`**.

## Better Auth

- Configure Better Auth with **`mongodbAdapter`** from **`better-auth/adapters/mongodb`**.
- Pass **`db`** and **`client`** from **`getAuthMongoDb()`** / **`getAuthMongoClient()`** after **`await connectDB()`**.
- Better Auth manages its own auth collections; no Mongoose schema generation step for auth tables.

## App data

- Define Mongoose models under **`src/db/schema/`**.
- Call **`connectDB()`** before querying models in services, tRPC procedures, and workers.
- Validate **`DATABASE_URL`** as a MongoDB connection string in **`src/lib/env.ts`** (`mongodb://` or `mongodb+srv://`).

## Not database-related

**`src/lib/route-progress.ts`**, **`src/hooks/use-route-transition-progress.ts`**, and **`src/components/route-transition-progress.tsx`** are **in-app navigation UI** (top progress bar during `/app` route changes). The name **route-progress** means **page navigation progress**, not PostgreSQL or any database.
