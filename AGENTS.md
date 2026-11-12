# pra-console: instructions for AI agents

Admin console of the Marlink PRA Platform, also called "PRA Admin" (Angular 14, Nx 20, Angular Material, RxJS). Repository: GitHub `azaschka/marlink-pra-console`, branch `main`. This file is the entry point: hard rules and a router to the detail documents.

Last reviewed: 2026-11-12

## Where to look

| You need | Read |
|---|---|
| Workspace rules (boundaries, git, documentation duty) | [../AGENTS.md](../AGENTS.md) (when checked out inside the `pra-platform` workspace) |
| Platform knowledge, this repository's service file, domain files of your area | [../docs/knowledge/index.md](../docs/knowledge/index.md), then [../docs/knowledge/pra-console.md](../docs/knowledge/pra-console.md) |
| Services, interceptor, error handling, runtime config and secrets | [docs/api-services.md](docs/api-services.md) |
| Components, templates, styles, RxJS, upgrade readiness, quality gates, testing | [docs/frontend-patterns.md](docs/frontend-patterns.md) |
| Caches, TTLs, invalidation rules | [docs/cache-strategy.md](docs/cache-strategy.md) |
| How BeyondTrust objects are named by the platform | [docs/pra-beyondtrust-object-naming.md](docs/pra-beyondtrust-object-naming.md) |
| Planned modernization waves and the Angular upgrade path | [docs/modernization-roadmap.md](docs/modernization-roadmap.md) |
| A change that follows or causes a pra-api contract change | [../docs/knowledge/cross-repo-contracts.md](../docs/knowledge/cross-repo-contracts.md) |

## Commands

| Purpose | Command |
|---|---|
| Install | `npm ci --legacy-peer-deps` (plain `npm ci` fails on a TypeScript peer conflict of `@module-federation/*`; verified 2026-10-01) |
| Type check | `npm run typecheck` |
| Unit tests | `npx nx test` (Karma; needs a Chrome or Chromium binary, `CHROME_BIN`) |
| Build | `npx nx build`; production `npm run build:console` |
| Lint | `npm run lint` (no auto-fix) |
| Dev server | `npm run start:local` (generates the local env) or `nx serve` (not `ng serve`) |
| Container image | `npm run docker:prepare:console`, publish with `npm run publish:console` (only on explicit request) |

## Hard rules

- Boundaries: the console talks to pra-api only. Never call pra-sync-api or BeyondTrust directly. The UI hides or disables actions for convenience only; pra-api enforces the rules. Keep route role checks and navigation role filtering aligned.
- API and auth: relative endpoints only; base URL, `x-api-key`, `x-access-key` and the JWT are added by `src/app/shared/interceptors/api.interceptor.ts`, never in services or components. Details: [docs/api-services.md](docs/api-services.md).
- Secrets and runtime config: never commit secrets, passwords, API keys, tokens or proxy credentials. Runtime configuration comes from `src/assets/scripts/env.js`, rendered at container start (git-ignored, generated locally by `scripts/generate-local-env.sh`). Docker and proxy credentials come from the environment, never from files.
- Services: `Promise<T>` via `firstValueFrom`; await and return mutations; `X-Tenant-Id` for tenant-scoped resources; invalidate caches after mutations ([docs/cache-strategy.md](docs/cache-strategy.md)).
- Error handling: let `HttpClient` errors bubble; no silent fallbacks (empty array, `null`) and no HTML error strings in services; catch only to clean up, add context (`[Service.method] ...`, `Error` objects only) or for a documented best-effort batch, and rethrow otherwise.
- RxJS lifecycle: every manual subscription has a teardown (`subscriptionsToClear` in components that extend `PraBaseComponent`, otherwise `takeUntil` with `OnDestroy`). Use `onBusinessUnitChanged()` instead of a second auth-user subscription. Choose `switchMap`, `concatMap`, `exhaustMap` or `mergeMap` deliberately.
- Quality gates for every functional change: `npm run typecheck`, `npm run lint`, `npm run build:console`, existing specs green, manual smoke check of the affected path. Small, reviewable changesets.
- Unit tests: the console is not ready for systematic unit testing yet (decision by André, 2026-10-07). Do not add new specs unless asked; keep the existing ones green (`npx nx test`).
- Contracts: a change to headers, DTO shapes, status or error shapes, auth or configuration keys is a coupled change across repositories. Follow [../docs/knowledge/cross-repo-contracts.md](../docs/knowledge/cross-repo-contracts.md), state compatibility and rollout order.
- New code stays upgrade-safe (no deprecated Angular APIs, typed reactive forms, explicit teardown): [docs/frontend-patterns.md](docs/frontend-patterns.md).

## Rules specific to this repository

- Feature code lives in `src/app/views/<feature>/` with its own `<feature>.service.ts`; shared code in `src/app/shared/`. The console says **jump-assets** where the APIs say **jump-item**.
- User-facing text goes into `src/assets/i18n/en.json`.
- Site ingestion: template `src/assets/templates/PRA Ingestion Template.xlsx`, parser `src/app/shared/services/site-excel-parser.service.ts`, factories in `src/app/views/sites/factories/` and `src/app/views/customers/factories/`, orchestration in `src/app/views/sites/workflows/site-import-workflow.ts`. The `site` sheet is parsed by header name (header row 2); `support_teams`, `users`, `hosts` by column position. New columns must not shift existing positions; old templates must keep working. Read `../docs/knowledge/domains/site-ingestion.md` first.
- Edit User dialog (`src/app/views/users/components/user-overlay/`): for an external user display name, username, email and password regeneration are read-only, and saving sends no `PATCH /users/{id}` at all (BeyondTrust rejects display name and email even when unchanged, MARLINKPRA-79); only the group policy changes go to `PATCH /users/{id}/group-policies`. Every re-enable of the form has to be followed by `applyUserTypeRestrictions()`.
- BU Admin visibility has one source of truth: `src/app/shared/helpers/pra-data-filter.ts`. `isGroupPolicyNameVisibleForBuAdmin` decides which policies a BU Admin sees and may assign (Group Policies view, user overlay); `isGroupPolicyNameOfBusinessUnit`, the same criteria without the global FULL_ACCESS and LIMITED_ACCESS policies, decides which users a BU Admin sees (Users view). `BU_OPERATOR_GP_MAP` and `BU_SAML_DEFAULT_GP_MAP` mirror the maps of the same name in pra-api (`src/site/workflows/group-policies/`); change both repositories together. BeyondTrust, not the platform, adds new external users to `GP_<BU>_SAML_DEFAULT`; pra-api removes them once the import has assigned their site policies. Read `../docs/knowledge/domains/bu-admin-visibility.md` first.
- List views (`mat-table` with flex rows): exactly one flexible column (`flex: 1 1 auto`), every other column with a fixed or percentage width, otherwise cells stop lining up between rows. Do not wrap cell content in a `<span>`: the global rule `.mat-cell > span { overflow: hidden }` (`src/assets/styles/scss/components/_mat-table.scss`) lets it shrink and clip its content. The actions column holds 40px icon buttons; 96px plus the 24px cell padding fits three.
- Polling (dashboard health, manual discrepancy scan): `exhaustMap` so that requests never overlap, stop the poll when the selected BeyondTrust instance changes, and give a running poll an upper bound. A permanent poll pauses while the browser tab is hidden.
- Text built in TypeScript with `translate.instant()` needs loaded translations: prefer the `translate` pipe in templates, otherwise wait for `TranslateService.get()` before building view models.
- Postman download (`src/assets/docs/Marlink PRA API.postman_collection.json`): a byte-identical copy of the pra-api customer export, written by `npm run postman:export:console` in pra-api. Never edit it here. The asset path in `src/app/shared/services/navigation.service.ts` and the download name in `src/app/shared/components/sidenav/sidenav.template.html` must match `scripts/postman/config/collection.config.ts` in pra-api; `npm run postman:check` there verifies it.

## Git

`main` is the integration and release branch (there is no `develop`) with a linear history. Feature branches start from `main`. Commit subject `<ID>: <imperative summary>`. No push, merge or deployment without explicit instruction. Workspace rules: `../AGENTS.md`.

## Documentation duty

Update the knowledge base after each issue (`../docs/knowledge/conventions.md`). Repository docs under `docs/` are committed together with the code change they describe.
