# petzko-edge

Cloudflare Worker + D1 (serverless SQLite) for the site's stats / guest-log /
guestbook data layer. Runs at the Cloudflare edge on `petzko.sh/api/*`, in front
of the cluster origin. Deployed with `wrangler` — **separate** from the ArgoCD
flow that owns the Kubernetes cluster.

```
Browser ─▶ petzko.sh
            ├─ /api/*          ─▶ this Worker ─▶ D1 (petzko-stats)
            └─ everything else ─▶ origin (Traefik .226 ─▶ nginx SPA + resume-proxy)
```

## Endpoints

| Method | Path          | What it does                                          |
| ------ | ------------- | ----------------------------------------------------- |
| GET    | `/api/health` | liveness, no DB                                       |
| GET    | `/api/stats`  | `{ visits, uniques }` — page views + unique visitors  |
| POST   | `/api/visit`  | bump page views + record the (hashed) unique visitor  |

## One-time setup

All commands run from this `edge/` directory.

```bash
# 1. install tooling (wrangler, types)
npm install

# 2. authenticate wrangler with your Cloudflare account (opens a browser)
npx wrangler login

# 3. create the D1 database — copy the printed database_id…
npx wrangler d1 create petzko-stats
#    …into wrangler.jsonc -> d1_databases[0].database_id

# 4. generate the binding types (Env) from wrangler.jsonc
npm run types

# 5. apply the schema (applies all pending migrations)
npm run migrate:remote      # the live D1
npm run migrate:local       # the local wrangler-dev sandbox (separate copy)

# 6. set the IP hashing salt (used to count unique visitors without storing IPs)
npx wrangler secret put IP_SALT      # paste a long random string for production
echo 'IP_SALT=some-local-dev-salt' >> .dev.vars   # local-only value (gitignored)
```

## Local development

```bash
# terminal A — run the Worker locally on http://localhost:8787 (uses local D1)
cd edge && npm run dev

# terminal B — run the site; Vite proxies /api -> localhost:8787
cd frontend && npm run dev
```

Smoke test:

```bash
curl localhost:8787/api/health
curl localhost:8787/api/stats
curl -X POST localhost:8787/api/visit
```

## Deploy

```bash
npm run deploy              # publishes the Worker + attaches the petzko.sh/api/* route
curl https://petzko.sh/api/health
```

## How D1 is configured

D1 is Cloudflare's serverless SQLite. It's reached **only from a Worker via a
binding** (not a wire-protocol connection), which is why this Worker exists.

**Binding** — declared in `wrangler.jsonc` under `d1_databases`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",                  // → available in code as env.DB
    "database_name": "petzko-stats",  // human name; set at create time, immutable
    "database_id": "<uuid>",          // from `wrangler d1 create`; identifies the DB
    "migrations_dir": "migrations"    // where the .sql migration files live
  }
]
```

- `binding` is the JS handle: the Worker queries it as `env.DB.prepare(...)`.
- `database_id` is the only field you fill by hand — paste the UUID printed by
  `wrangler d1 create petzko-stats`. It is **not a secret** (it just names the DB),
  so it's safe to commit in `wrangler.jsonc`.
- Prefer the **database name** over the binding name in `wrangler d1` commands —
  the binding can be renamed, the name can't, so it won't target the wrong DB.

**Types** — `env.DB` is typed by `worker-configuration.d.ts`, generated from the
bindings above by `npm run types` (`wrangler types`). It's **gitignored** and
regenerated, never hand-edited. Rerun `wrangler types` whenever you change a
binding in `wrangler.jsonc`. (We intentionally do **not** use
`@cloudflare/workers-types` — `wrangler types` emits runtime types matched to the
`compatibility_date`, and recommends against the standalone package.)

**Migrations** — versioned `.sql` files in `migrations/`, applied in filename
order:

- `wrangler d1 migrations apply` records each applied file in a `d1_migrations`
  table inside the DB, so re-running only applies new ones.
- **Local and remote are separate databases.** `--local` targets the on-disk
  SQLite sandbox that `wrangler dev` uses (under `.wrangler/`); `--remote`
  targets the live D1 at Cloudflare. Apply to **both** (`npm run migrate:local`
  and `npm run migrate:remote`).
- Add a schema change by creating the next file, e.g.
  `npx wrangler d1 migrations create petzko-stats add_reactions`, editing the
  generated `0002_*.sql`, then applying it local + remote.

**Querying** — always use **parameterized prepared statements**
(`env.DB.prepare('… WHERE key = ?').bind(key)`), never string interpolation, to
avoid SQL injection. See `src/index.ts` for the counter helpers.

**Local dev data** lives in `.wrangler/` (gitignored) — wiping it resets your
local DB; the remote D1 is untouched.

## How stats are counted

- **`counters.visits`** — total page views. The SPA beacons `POST /api/visit` on
  every load; the Worker increments this counter.
- **`unique_visitors`** — unique-visitor count. On each `/api/visit`, the Worker
  hashes the client IP (`CF-Connecting-IP`, set by Cloudflare) as
  `sha256(IP_SALT + ip)` and `INSERT OR IGNORE`s it. `COUNT(*)` = uniques. The
  **raw IP is never stored** — only the salted hash — so it's privacy-preserving
  and the salt being secret means the hashes can't be reversed. `GET /api/stats`
  returns `{ visits, uniques }`.
- Locally (`wrangler dev`) there's no real edge, so `CF-Connecting-IP` is absent
  and the Worker falls back to a constant — expect `uniques` ≈ 1 in dev. If
  `IP_SALT` is unset it uses an insecure dev fallback (with a logged warning);
  **always set the real secret in production**.

## Notes

- **Secrets** go in via `npx wrangler secret put NAME`, never in git; local dev
  reads them from `.dev.vars` (gitignored). Current: **`IP_SALT`** (unique-visitor
  hashing). Later phases add Turnstile + an admin token.
- `compatibility_date` is pinned in `wrangler.jsonc`; bump it deliberately to
  opt into newer runtime behavior (and rerun `wrangler types`).
- `nodejs_compat` is intentionally **off** — this Worker uses only Web-standard
  APIs. Add the flag in `wrangler.jsonc` only if you pull in a Node-dependent lib.
- A GitHub Actions `wrangler deploy` step (with a `CLOUDFLARE_API_TOKEN` secret)
  can automate deploys later; for now CLI deploys are fine.
- D1 free-tier limits (storage, daily reads/writes) are far beyond this site's
  needs — check the current numbers in the Cloudflare D1 docs before relying on
  them.
