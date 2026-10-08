# pra-console: instructions for AI agents

Admin console of the Marlink PRA Platform (Angular 14, Nx 20, Angular Material, RxJS). Talks only to pra-api, through relative URLs and the central API interceptor. Never calls pra-sync-api or BeyondTrust directly.

Last reviewed: 2026-10-08

## Read first

1. The workspace instructions in `../AGENTS.md` and the knowledge base in `../docs/knowledge/` (start at `index.md`, then `pra-console.md` and the domain files of your area), when this repository is checked out inside the `pra-platform` workspace.
2. [.github/copilot-instructions.md](.github/copilot-instructions.md) and the scoped rules in [.github/instructions/](.github/instructions/): frontend patterns, API service and error handling patterns, RxJS lifecycle, testing strategy, quality gates, secrets and runtime config, Angular upgrade readiness, system boundaries. Canonical for this repository.
3. [.github/CROSS_REPO_CONTRACT_CHECKLIST.md](.github/CROSS_REPO_CONTRACT_CHECKLIST.md) for any change that follows a pra-api contract change.
4. Repository docs in [docs/](docs/): cache strategy, BeyondTrust object naming, modernization roadmap.

## Commands

| Purpose | Command |
|---|---|
| Install | `npm ci --legacy-peer-deps` (plain `npm ci` fails on a TypeScript peer conflict of `@module-federation/*`; verified 2026-10-01) |
| Type check | `npm run typecheck` |
| Unit tests | `npx nx test` (Karma; needs a Chrome or Chromium binary, `CHROME_BIN`) |
| Build | `npx nx build`; production `npm run build:console` |
| Lint | `npm run lint` (no auto-fix) |
| Dev server | `npm run start:local` (generates the local env) or `nx serve` |

## Rules specific to this repository

- Git: `main` is the integration and release branch (there is no `develop`). Feature branches start from `main`. Commit subject `<ID>: <imperative summary>`. No push, merge or deployment without explicit instruction.
- Feature code lives in `src/app/views/<feature>/` with its own `<feature>.service.ts`; shared code in `src/app/shared/`. The console says **jump-assets** where the APIs say **jump-item**.
- User-facing text goes into `src/assets/i18n/en.json`.
- Site ingestion: template `src/assets/templates/PRA Ingestion Template.xlsx`, parser `src/app/shared/services/site-excel-parser.service.ts`, factories in `src/app/views/sites/factories/` and `src/app/views/customers/factories/`, orchestration in `src/app/views/sites/workflows/site-import-workflow.ts`. The `site` sheet is parsed by header name (header row 2); `support_teams`, `users`, `hosts` by column position. New columns must not shift existing positions; old templates must keep working. Read `../docs/knowledge/domains/site-ingestion.md` first.
- UI hides or disables actions for convenience only; pra-api enforces the rules.
- BU Admin visibility has one source of truth: `src/app/shared/helpers/pra-data-filter.ts` (`isGroupPolicyNameVisibleForBuAdmin`), used by the Users view, the Group Policies view and the user overlay. `BU_OPERATOR_GP_MAP` and `BU_SAML_DEFAULT_GP_MAP` mirror the maps of the same name in pra-api (`src/site/workflows/group-policies/`); change both repositories together. Read `../docs/knowledge/domains/bu-admin-visibility.md` first.
- List views (`mat-table` with flex rows): exactly one flexible column (`flex: 1 1 auto`), every other column with a fixed or percentage width, otherwise cells stop lining up between rows. Do not wrap cell content in a `<span>`: the global rule `.mat-cell > span { overflow: hidden }` (`src/assets/styles/scss/components/_mat-table.scss`) lets it shrink and clip its content. The actions column holds 40px icon buttons; 96px plus the 24px cell padding fits three.
- Polling (dashboard health, manual discrepancy scan): `exhaustMap` so that requests never overlap, stop the poll when the selected BeyondTrust instance changes, and give a running poll an upper bound. A permanent poll pauses while the browser tab is hidden.
- Text built in TypeScript with `translate.instant()` needs loaded translations: prefer the `translate` pipe in templates, otherwise wait for `TranslateService.get()` before building view models.
- Unit tests: the console is not ready for systematic unit testing yet (decision by André, 2026-10-07). Do not add new specs unless asked; keep the existing ones green (`npx nx test`).
- Never commit secrets; runtime configuration comes from `src/assets/scripts/env.js` at container start.

## Documentation duty

Update the knowledge base after each issue (`../docs/knowledge/conventions.md`). Repository docs under `docs/` are committed together with the code change they describe.
