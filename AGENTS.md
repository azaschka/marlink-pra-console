# pra-console: instructions for AI agents

Admin console of the Marlink PRA Platform (Angular 14, Nx 20, Angular Material, RxJS). Talks only to pra-api, through relative URLs and the central API interceptor. Never calls pra-sync-api or BeyondTrust directly.

Last reviewed: 2026-10-01

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
- Never commit secrets; runtime configuration comes from `src/assets/scripts/env.js` at container start.

## Documentation duty

Update the knowledge base after each issue (`../docs/knowledge/conventions.md`). Repository docs under `docs/` are committed together with the code change they describe.
