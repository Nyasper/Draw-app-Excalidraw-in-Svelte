# AGENTS.md

## Package manager

- **Bun only.** Use `bun` for all install, run, and script commands. Lockfile is `bun.lock`.

## Commands

| Command               | What it does                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| `bun run dev`         | Start Vite dev server (port 5173)                                          |
| `bun run build`       | Production build                                                           |
| `bun run check`       | Type-check (runs `svelte-kit sync` then `svelte-check`)                    |
| `bun run lint`        | Lint + format check (`prettier --check . && eslint .`)                     |
| `bun run format`      | Auto-format with Prettier                                                  |
| `bun run db:start`    | Start PostgreSQL 18 via Docker Compose                                     |
| `bun run db:push`     | Push Drizzle schema directly to DB (no migration files)                    |
| `bun run db:generate` | Generate Drizzle migration files                                           |
| `bun run db:migrate`  | Apply Drizzle migrations                                                   |
| `bun run auth:schema` | Generate Better Auth schema tables into `src/lib/server/db/auth.schema.ts` |

**Workflow order for DB setup:** `db:start` -> `db:push` (or `db:generate` + `db:migrate`). After initial auth setup, run `auth:schema` to populate the auth schema file — it is currently a placeholder.

## Environment

- Copy `.env.example` to `.env` and fill in values. `.env` is gitignored.
- Required vars: `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET`. Optional: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

## Architecture

```
src/
  app.css                    Global CSS variables (dark theme Excalidraw-style) + reset
  app.html                   HTML shell with Inter font
  app.d.ts                   App.Locals typed with User/Session
  hooks.server.ts            Better Auth session hook + svelteKitHandler
  lib/
    assets/favicon.svg
    index.ts
    components/
      Excalidraw.svelte       Core: wraps React Excalidraw via {@attach} + $effect()
      Nav.svelte              Top navigation bar (auth-aware)
      Dashboard.svelte        Folder sidebar + drawing grid
    server/
      auth.ts                 Better Auth config (Drizzle adapter, email+password, GitHub OAuth)
      db/
        index.ts              Drizzle ORM + postgres.js connection (uses process.env for jiti compat)
        schema.ts             App tables: folder, drawing + re-exports auth.schema
        auth.schema.ts        Auth tables: user, session, account, verification (generated)
        queries.ts            Reusable DB query functions (CRUD for folders & drawings)
  routes/
    +layout.svelte            Root layout: conditionally shows Nav (hidden on /draw)
    +layout.server.ts         Provides user to all routes
    +page.svelte              Home: landing page (guest) or Dashboard (authenticated)
    +page.server.ts           Load folders/drawings if auth; signOut action
    about/+page.svelte        About page (EN/ES project explanation)
    login/
      +page.svelte            Login form (email + GitHub OAuth)
      +page.server.ts         signInEmail, signInSocial actions
    register/
      +page.svelte            Register form (email + GitHub OAuth)
      +page.server.ts         signUpEmail, signInSocial actions
    draw/
      +page.svelte            Canvas: guest (localStorage) or auth (DB auto-save with debounce)
      +page.server.ts         Provides user info
      +server.ts              POST: create new drawing (auth required)
      [id]/
        +page.svelte          Canvas for existing drawing (loads from DB)
        +page.server.ts       Load drawing by ID
        +server.ts            PUT: update drawing, DELETE: remove drawing
    folders/
      +server.ts              GET/POST: list and create folders
```

## Data model

| Table          | Columns                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`         | `id` (text PK), `name`, `email` (unique), `email_verified`, `image`, `created_at`, `updated_at`                                                                     |
| `session`      | `id` (text PK), `user_id` (FK), `token` (unique), `expires_at`, `ip_address`, `user_agent`                                                                          |
| `account`      | `id` (text PK), `user_id` (FK), `provider_id`, `account_id`, access/refresh tokens                                                                                  |
| `verification` | `id` (text PK), `identifier`, `value`, `expires_at`                                                                                                                 |
| `folder`       | `id` (serial PK), `user_id` (FK), `parent_folder_id` (self-ref FK nullable), `name`, `created_at`, `updated_at`                                                     |
| `drawing`      | `id` (serial PK), `user_id` (FK nullable), `folder_id` (FK nullable), `title`, `elements` (jsonb), `app_state` (jsonb), `files` (jsonb), `created_at`, `updated_at` |

## Key design decisions

- **Guest mode**: Unauthenticated users can draw via `/draw`. Data persists in `localStorage`. A banner suggests registering to save permanently.
- **Auto-save**: Authenticated users get debounced (3s) auto-save to PostgreSQL via JSONB columns. Manual save button also available.
- **No React framework**: React is only used inside `Excalidraw.svelte` via `createRoot()`/`createElement()`. The entire routing and server logic is SvelteKit.
- **Nav hidden on canvas**: Root layout checks `$app/state.page.url.pathname` — if starts with `/draw`, Nav is hidden for full-screen canvas.
- **JSONB for Excalidraw state**: `elements`, `app_state`, `files` stored as JSONB. `collaborators` is always reset to empty Map on load.
- **CSS**: Native CSS variables in `app.css`. Dark theme matching Excalidraw's palette (`--bg-primary: #1e1e1e`, `--accent: #6965db`).

## Framework quirks

- **Svelte 5 runes mode is forced** (`svelte.config.js`). Use `$state`, `$derived`, `$effect`, `{@render children()}`, `$props()`. No `$:` reactive declarations or `<slot>`.
- **TypeScript 6, strict.** `verbatimModuleSyntax: true` in `.svelte-kit/tsconfig.json` — use `import type` for type-only imports.
- **ESLint flat config** (`eslint.config.js`), not the legacy `.eslintrc` format.
- **`.svelte-kit/` is auto-generated** and gitignored. Never edit files inside it.

## Code style

- Prettier: **tabs**, **single quotes**, **no trailing commas**, `printWidth: 100`.
- `prettier-plugin-svelte` handles `.svelte` files.

## Testing

- **No test framework is configured.** There are no test files, no vitest, no jest, no playwright.

## Gotchas

- **`db/index.ts` uses `process.env`** instead of `$env/dynamic/private` for compatibility with the Better Auth CLI (jiti).
- **All packages are in `devDependencies`** — there are no production `dependencies`.
