# GCS — Project Guide for Claude

Gauntlet Championship Series (formerly VeryLastNerve League) — web tooling for a
casual League of Legends draft league.

## Architecture philosophies — read first

Before changing code, read **[ARCHITECTURE_PHILOSOPHIES.md](./ARCHITECTURE_PHILOSOPHIES.md)**
and follow the principles there. We are incrementally migrating to a
**hexagonal (domain + ports/adapters + use case)** architecture, one vertical
slice at a time, with **dependency injection** so the core is unit-testable
without a database. When you touch a feature, extract its business rules into
`src/core`, define the port it needs, implement the adapter, and reduce the
React/route layer to a thin caller. Add a new philosophy to that doc (in the same
PR) if a change needs one.

## Tech stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript** (strict).
- **Postgres** via **Drizzle ORM** on **Neon** (`@neondatabase/serverless`).
- **NextAuth 5** with **Discord** OAuth (`src/db/auth.ts`).
- External APIs: **Riot Games** (`src/riot`), **Twitch** (`src/ttv`),
  **Discord** (`src/discord`) — thin `*Fetch` wrappers.
- Styling: SCSS **CSS Modules** (`*.module.scss`), co-located with components.

## Layout

```
src/
  core/            Hexagonal application core (new; grows per slice).
    <feature>/domain | ports | usecases
  adapters/        Port implementations (e.g. db/ Drizzle repositories).
  app/             Next.js routes: pages (Server Components), server actions,
                   and the read-only REST API under app/api.
  db/              schema.ts (Drizzle tables), db.ts (Neon client), auth.ts.
  riot/ ttv/ discord/   External API clients.
  util/            One-function-per-file helpers (the de-facto legacy "domain";
                   migrating into core slice by slice).
  components/      Server + client React components.
  types/           Enums and external DTO types.
```

## Conventions

- **One exported function/class per file**, named like the file; default export.
- Exported members get a **TSDoc** comment with `@public` / `@internal`
  (`tsdoc/syntax` is an error-level lint rule).
- ESLint uses `eslint.configs.all` + `strictTypeChecked` — object keys and
  imports are auto-sorted. **Run `npm run beautify` before `npm run lint`** to
  auto-fix ordering/formatting.
- TS is strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax` → use `import type` for type-only imports).
- Path aliases are rooted at `src` (`baseUrl: "src"`): import as
  `core/...`, `util/...`, `types/...`, `db/...` (no `@/` prefix).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) on :3000. |
| `npm run build` | Production build. |
| `npm run lint` | ESLint over `src` (this is what CI runs). |
| `npm run beautify` | `eslint --fix` — run before `lint`. |
| `npm test` | Vitest unit tests (core/domain/use cases). |
| `npm run drizzlePush` | Push schema to the database (`drizzle-kit push`). |

## Running locally

Requires a `.env` (gitignored). See `README.md` for the full variable list.

> **Gotcha:** the runtime DB client reads **`DATABASE_URL`**
> (`src/db/db.ts`) while Drizzle Kit reads **`POSTGRES_URL`**
> (`drizzle.config.ts`, and the README). Set **both** to the same Postgres
> connection string. A free Neon project is the lowest-friction option (the
> client speaks the Neon serverless HTTP protocol).

Minimum to boot and exercise standings: `DATABASE_URL` + `POSTGRES_URL` +
`AUTH_SECRET`. Discord vars are needed for login, `RIOT_API_KEY` for account
linking / game import.
