# PRA Console - AI Coding Agent Instructions

## Scope

Angular 14 admin UI for PRA operations. Keep changes aligned with current patterns in `src/app/views/*` and shared platform code under `src/app/shared/*`.

## Fast Start Commands

- Install: `npm install`
- Dev server: `nx serve` (do not prefer `ng serve` in this repo)
- Unit tests: `nx test`
- Production build: `npm run build:console`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Docker pipeline: `npm run docker:prepare:console`, `npm run publish:console`

Command source of truth: [package.json](../package.json).

## Security and Secrets (Critical)

- Never commit secrets, passwords, API keys, proxy credentials, or tokens.
- For local Docker publish flow, use the interactive login script (`npm run docker:login:marlink`) or environment variables (`DOCKER_MARLINK_USER`, `DOCKER_MARLINK_PASSWORD`).
- For local proxy credentials, use environment variables (`CORPORATE_PROXY_URL` or `HTTPS_PROXY`), not hardcoded values in source files.
- Runtime API credentials must come from runtime env injection (`src/assets/scripts/env.js` / container startup), not from committed TypeScript constants.

## API and Auth Rules (Critical)

- Use relative API endpoints in `HttpClient` calls, for example `"sites"`, `"auth/login"`.
- Do not manually prepend API base URL or auth headers in services.
- API request transformation is centralized in [src/app/shared/interceptors/api.interceptor.ts](../src/app/shared/interceptors/api.interceptor.ts).
- Interceptor behavior to preserve:
  - Skip `/assets` URLs.
  - Add `x-api-key`, `x-access-key`, and `Authorization` (if JWT exists).
  - Sign out on `401` for non-login endpoints.

## Runtime Config and Environments

- Runtime config enters through [src/assets/scripts/env.template.js](../src/assets/scripts/env.template.js) -> `env.js` at container startup.
- Production env reads from `window["env"]` in [src/environments/environment.prod.ts](../src/environments/environment.prod.ts).
- Development env also reads from `window["env"]` with safe fallbacks in [src/environments/environment.ts](../src/environments/environment.ts).
- App config mapping lives in [src/config.ts](../src/config.ts).

## Routing, Roles, Navigation

- Route structure and guards are defined in [src/app/app.routing.ts](../src/app/app.routing.ts).
- Child routes under admin layout are protected by `AuthGuard`; feature routes apply `UserRoleGuard` with `data.roles`.
- Navigation menu and role filtering live in [src/app/shared/services/navigation.service.ts](../src/app/shared/services/navigation.service.ts).
- `canManagePraUsers` is a special string permission, not an `AuthRole` enum value.

## Feature Work Conventions

- Place features in `src/app/views/<feature>/` with module, routing, component(s), service, and models.
- Add route entry in [src/app/app.routing.ts](../src/app/app.routing.ts).
- Add navigation item in [src/app/shared/services/navigation.service.ts](../src/app/shared/services/navigation.service.ts).
- Add translation keys in [src/assets/i18n/en.json](../src/assets/i18n/en.json).
- Prefer service methods returning `Promise<T>` via `firstValueFrom(...)` when integrating with existing async/await flows.

## Canonical Domain Docs (Link, Don’t Re-embed)

- Cache behavior and invalidation strategy: [docs/cache-strategy.md](../docs/cache-strategy.md)
- BeyondTrust naming conventions: [docs/pra-beyondtrust-object-naming.md](../docs/pra-beyondtrust-object-naming.md)

## Common Pitfalls

- Avoid introducing full absolute API URLs in service calls.
- Keep role checks consistent between routes and navigation.
- Preserve startup auth initialization via `APP_INITIALIZER` in [src/app/app.module.ts](../src/app/app.module.ts).
- Prefer `nx` scripts used by this workspace over legacy Angular CLI defaults from [README.md](../README.md).

## Required Quality Gates Per Changeset

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build:console`.
- For test-related or risk-sensitive changes, run `npm test -- --watch=false --browsers=ChromeHeadless`.

## Testing Baseline

- Current unit test runner is Karma/Jasmine.
- Keep Karma/Jasmine as baseline while stabilizing coverage.
- Jest may be introduced later, but only after baseline tests are stable and equivalent coverage is defined.
