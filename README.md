# pra-console

Angular admin console of the Marlink PRA Platform (BeyondTrust Privileged Remote Access integration), also called "PRA Admin". It talks only to `pra-api`.

Stack: Angular 14, Nx 20, Angular Material 14, RxJS, TypeScript. Repository: GitHub `azaschka/marlink-pra-console`, integration and release branch `main`.

## Getting started

```bash
npm ci --legacy-peer-deps      # plain "npm ci" fails on a TypeScript peer conflict
npm run start:local            # generates the local runtime env, then "nx serve"
```

`npm run start:local` needs the shell variables `PRA_DEV_API_KEY` and `PRA_DEV_ACCESS_KEY` (and optionally `PRA_DEV_API_BASE_URL`, default `/api`). `scripts/check-local-env.sh` aborts with instructions when they are missing. The dev server listens on `http://localhost:4200/` and proxies `/api` through `proxy.dev.conf.js` (set `CORPORATE_PROXY_URL` or `HTTPS_PROXY` behind a corporate proxy). Without generated keys use `npm start` (`nx serve`).

## Commands

| Purpose | Command |
|---|---|
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests (Karma, needs Chrome or Chromium) | `npx nx test` |
| Production build | `npm run build:console` (output in `dist/`) |
| Container image | `npm run docker:prepare:console`; publish with `npm run publish:console` |

Runtime configuration (`PRA_API_BASE_URL`, `PRA_API_KEY`, `PRA_ACCESS_KEY`) is rendered into `assets/scripts/env.js` from `src/assets/scripts/env.template.js` when the container starts. Never commit secrets or a generated `env.js`.

## Documentation

- [AGENTS.md](AGENTS.md): rules and entry point for contributors and AI agents (Claude Code); [CLAUDE.md](CLAUDE.md) imports it.
- [docs/api-services.md](docs/api-services.md): services, interceptor, error handling, runtime configuration.
- [docs/frontend-patterns.md](docs/frontend-patterns.md): components, RxJS, quality gates, testing status.
- [docs/cache-strategy.md](docs/cache-strategy.md): in-memory caches and invalidation.
- [docs/pra-beyondtrust-object-naming.md](docs/pra-beyondtrust-object-naming.md): how BeyondTrust objects are named by the platform.
- [docs/modernization-roadmap.md](docs/modernization-roadmap.md): modernization waves and Angular upgrade path.

Inside the `pra-platform` workspace the shared knowledge base is in `../docs/knowledge/` (start at `index.md`).
