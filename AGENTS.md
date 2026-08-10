# AGENTS.md

## Package manager

- **Bun only.** Use `bun` for all install, run, and script commands. Lockfile is `bun.lock`.

## Commands

| Command               | What it does                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| `bun run dev`         | Start Vite dev server (port 5173)                                          |
| `bun run build`       | Production build                                                           |
| `bun run preview`     | Preview production build                                                   |
| `bun run deploy`      | Build + deploy to Cloudflare Workers (`wrangler deploy`)                   |
| `bun run dev:cf`      | Build + run the CF build locally via `wrangler dev` (port 8787)            |
| `bun run check`       | Type-check (runs `svelte-kit sync` then `svelte-check`)                    |
| `bun run check:watch` | Type-check in watch mode                                                   |
| `bun run lint`        | Lint + format check (`prettier --check . && eslint .`)                     |
| `bun run format`      | Auto-format with Prettier                                                  |
| `bun run db:start`    | Start PostgreSQL 18 via Docker Compose                                     |
| `bun run db:push`     | Push Drizzle schema directly to DB (no migration files)                    |
| `bun run db:studio`   | Open Drizzle Studio                                                        |
| `bun run db:generate` | Generate Drizzle migration files                                           |
| `bun run db:migrate`  | Apply Drizzle migrations                                                   |
| `bun run auth:schema` | Generate Better Auth schema tables into `src/lib/server/db/auth.schema.ts` |

**Workflow order for DB setup:** `db:start` -> `db:push` (or `db:generate` + `db:migrate`). After initial auth setup, run `auth:schema` to populate the auth schema file — it is currently a placeholder.

## Environment

- Copy `.env.example` to `.env` and fill in values. `.env` is gitignored.
- Required vars: `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `MY_DOMAIN`. Optional: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CLIENT_ID_PROD`, `GITHUB_CLIENT_SECRET_PROD`.
- `ORIGIN` is used by Better Auth (`auth.ts:baseURL`) for OAuth callbacks and email links. Route handlers derive the origin dynamically from `event.url.origin`, so `ORIGIN` is only needed if you use OAuth or want outbound email links to point to the correct domain.
- `MY_DOMAIN` is the verified Resend domain used as the `from` address (`noreply@<MY_DOMAIN>`).
- **Production runs on Cloudflare Workers.** Env vars/secrets (`BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `MY_DOMAIN`, `ORIGIN`, `DATABASE_URL`, `GITHUB_CLIENT_ID_PROD`, `GITHUB_CLIENT_SECRET_PROD`) are set as **Workers secrets** in the Cloudflare dashboard (Worker → Settings → Variables and Secrets) and read at runtime via `$env/dynamic/private`. Set `ORIGIN=https://excalidraw-app.nyasper.dev` in prod.
- **Postgres in production connects directly to the Neon origin** via the `DATABASE_URL` secret (no Hyperdrive in the middle). Use the **direct** Neon endpoint (without `-pooler`) for consistent reads (the pooled endpoint can route reads to lagging replicas, which broke `findSession`). Local dev (`bun run dev`) still uses the `DATABASE_URL` in `.env` (Docker Postgres).
- GitHub OAuth uses two credential sets because GitHub allows only one callback URL per OAuth app. In dev (`bun run dev`) `auth.ts` uses `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` (callback `http://localhost:5173/api/auth/callback/github`); in production builds it uses `GITHUB_CLIENT_ID_PROD`/`GITHUB_CLIENT_SECRET_PROD` (falling back to the dev vars), selected via SvelteKit's `dev` flag.

## Architecture

```
src/
  app.css                    Global CSS variables (dark theme Excalidraw-style) + reset
  app.html                   HTML shell with Inter font
  app.d.ts                   App.Locals + App.Platform typed with User/Session
  hooks.server.ts            Better Auth session hook + svelteKitHandler + no-store on /api/auth/*
  lib/
    assets/favicon.svg
    components/
      Excalidraw.svelte       Core: wraps React Excalidraw via {@attach} + $effect()
      Nav.svelte              Top navigation bar (auth-aware)
      Dashboard.svelte        Folder sidebar + drawing grid
    server/
      auth.ts                 Better Auth config (Drizzle adapter, email/password + OAuth, email verificacion, password reset)
      email.ts                Resend SDK wrapper for sending transactional emails
      db/
        index.ts              Drizzle ORM + postgres.js lazy connection (Proxy). URL from $env/dynamic/private
        schema.ts             App tables: folder, drawing + re-exports auth.schema
        auth.schema.ts        Auth tables: user, session, account, verification (generated)
        queries.ts            Reusable DB query functions (CRUD for folders & drawings)
  routes/
    +layout.svelte            Root layout: conditionally shows Nav (hidden on /draw)
    +layout.server.ts         Provides user to all routes
    +page.svelte              Home: landing page (guest) or Dashboard (authenticated)
    +page.server.ts           Load folders/drawings if auth; signOut, createFolder, createDrawing actions
    about/+page.svelte        About page (EN/ES project explanation)
    login/
      +page.svelte            Login form (email + GitHub OAuth + forgot password link)
      +page.server.ts         signInEmail, signInSocial actions
    register/
      +page.svelte            Register form (email + GitHub OAuth + password confirmation)
      +page.server.ts         signUpEmail, signInSocial actions
    forgot-password/
      +page.svelte            Request password reset form
      +page.server.ts         requestReset action (sends email via Resend)
    reset-password/
      +page.svelte            Set new password form (token from email)
      +page.server.ts         resetPassword action
    draw/
      +page.svelte            Canvas: guest (localStorage) or auth (DB auto-save with debounce)
      +page.server.ts         Provides user info
      +server.ts              POST: create new drawing (auth required)
      [id]/
        +page.svelte          Canvas for existing drawing (loads from DB)
        +page.server.ts       Load drawing by ID
        +server.ts            PUT: update drawing, DELETE: remove drawing
    profile/
      +page.svelte            User profile: stats (drawings/folders count) + change password form
      +page.server.ts         Load user stats; changePassword action
    folders/
      +server.ts              GET/POST: list and create folders
      [id]/
        +server.ts            PUT: rename folder, DELETE: remove folder
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
- **Email verification**: Enabled via `emailVerification.requireEmailVerification`. Uses Resend SDK to send verification links. Unverified users cannot sign in.
- **Password reset**: Full forgot/reset flow via `emailAndPassword.sendResetPassword` with Resend. Token expires in 1 hour.
- **Default folder**: First authenticated page load auto-creates a "My Drawings" folder if none exist.
- **Dashboard**: Drag-to-select with mouse rectangle, Ctrl+click (toggle), Shift+click (range). View toggle between grid (cards) and list (table with dates). Bulk delete for selected drawings.
- **Resend**: SDK wrapper in `src/lib/server/email.ts`. Uses idempotency keys, returns `{ ok, error/id }` tuple. Never called from browser (API key protection).

## Deployment

- **Platform**: Cloudflare Workers with Static Assets (`@sveltejs/adapter-cloudflare`). Output goes to `.svelte-kit/cloudflare`.
- **CI**: Cloudflare **Workers Builds** (Git integration) connected to this GitHub repo — every push to the configured branch builds with `bun install && bun run build` and deploys automatically. Manual deploys are possible with `bun run deploy` and local CF testing with `bun run dev:cf`.
- **`wrangler.jsonc`**: single source of truth for the worker (`main`, `assets`, `compatibility_flags: ["nodejs_compat", "nodejs_als"]`). `secrets.required` lists all secrets that must exist on the worker for any deploy to pass.
- **Rollback**: `wrangler rollback` restores the previous deployed version if a deploy misbehaves.

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

- **`db/index.ts` uses `$env/dynamic/private`** for the DB URL. `$env/static/private` is NOT usable on Cloudflare Workers — vars/secrets only exist at runtime. The prod connection string comes from the `DATABASE_URL` **secret** (direct Neon origin, no `-pooler`); local dev (`vite`) falls back to the `DATABASE_URL` in `.env` (Docker Postgres).
- **Cloudflare binds things at runtime**: Excalidraw stays client-side (large). Server bundle (`_worker.js`) is built from `node_modules`; `postgres` resolves its `workerd` build via conditional exports, so it must be kept in `dependencies` (not externalized).
- **`tsconfig.json` sets `skipLibCheck: true`** to avoid type errors from third-party `.d.ts` files (drizzle-orm/mysql2, `@excalidraw/*`, `browser-fs-access`). Do not set it back to `false`.
