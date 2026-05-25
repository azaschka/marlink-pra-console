# PRA Console - AI Coding Agent Instructions

Guidance for AI coding agents working in this repository.

## Project Snapshot

- Stack: Angular 14, Nx, Angular Material, RxJS.
- Purpose: frontend admin console for PRA operations and management workflows.
- Architecture center: feature modules under src/app/views with shared platform code under src/app/shared.

## System Boundaries and Dependencies

- This project is the UI layer in the PRA stack.
- Primary downstream API: PRA API.
- Do not call PRA Sync API directly from the frontend.
- Do not implement direct BeyondTrust API calls in frontend services.
- Keep API base URL and auth header composition centralized in interceptors/runtime config.
- If endpoint contracts change in PRA API, coordinate corresponding frontend service/model updates.

## Coupled-Change Policy

- Mark changes as coupled across at least two repositories when contract surface changes occur (headers, DTO shapes, status/error shape, auth behavior).
- Use the shared checklist in [.github/CROSS_REPO_CONTRACT_CHECKLIST.md](./CROSS_REPO_CONTRACT_CHECKLIST.md) and include affected repos in PR notes.
- For coupled changes, document compatibility impact and rollout order.

## Fast Start Commands

- Install: npm install
- Dev server: nx serve (do not prefer ng serve in this repo)
- Unit tests: nx test
- Production build: npm run build:console
- Type check: npm run typecheck
- Lint: npm run lint
- Docker pipeline: npm run docker:prepare:console, npm run publish:console

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

## Coding Rules That Matter Here

- Keep API communication in Angular services; keep components focused on UI orchestration/state.
- Preserve route guard and role behavior consistency between app routing and navigation service.
- Use existing shared dialog and helper services for confirmations, notifications, and error display.
- Keep startup auth/bootstrap behavior aligned with APP_INITIALIZER flow in app.module.
- Reuse established feature patterns in neighboring modules before introducing new abstractions.

## Linting, Naming, and Quality Rules

- Run npm run typecheck and npm run lint before completion.
- Avoid any unless unavoidable and keep explicit typing for API payloads/models.
- Keep naming aligned with current conventions in src/app/views and shared services.
- Keep user-facing text translatable; add keys in src/assets/i18n/en.json instead of hardcoded strings.

## Validation Checklist Before Finalizing

- npm run typecheck
- npm run lint
- npm run build:console
- For flow-critical changes, run nx test or targeted tests and validate key smoke flows manually (login, role-based navigation, affected CRUD path).

## Canonical Domain Docs (Link, Don’t Re-embed)

- Cache behavior and invalidation strategy: [docs/cache-strategy.md](../docs/cache-strategy.md)
- BeyondTrust naming conventions: [docs/pra-beyondtrust-object-naming.md](../docs/pra-beyondtrust-object-naming.md)
- Primary backend contract repo: [pra-api/README.md](../../pra-api/README.md)
- Sync backend repo (indirect dependency via PRA API): [pra-sync-api/README.md](../../pra-sync-api/README.md)
- Shared contract checklist: [.github/CROSS_REPO_CONTRACT_CHECKLIST.md](./CROSS_REPO_CONTRACT_CHECKLIST.md)

## Common Pitfalls

- Avoid introducing full absolute API URLs in service calls.
- Keep role checks consistent between routes and navigation.
- Preserve startup auth initialization via `APP_INITIALIZER` in [src/app/app.module.ts](../src/app/app.module.ts).
- Prefer `nx` scripts used by this workspace over legacy Angular CLI defaults from [README.md](../README.md).

## Testing Baseline

- Current unit test runner is Karma/Jasmine.
- Keep Karma/Jasmine as baseline while stabilizing coverage.
- Jest may be introduced later, but only after baseline tests are stable and equivalent coverage is defined.
