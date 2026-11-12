# Frontend patterns, RxJS rules, quality gates and testing

Detailed conventions for components, templates, styles, RxJS, Angular upgrade readiness and verification of changes. Hard rules are summarised in [AGENTS.md](../AGENTS.md). For services, the interceptor, error handling and runtime configuration see [api-services.md](api-services.md).

The rules describe the target convention for new and changed code. Existing code may deviate; reuse the pattern of the neighbouring feature before introducing a new abstraction, and keep changesets small.

## 1. Structure and conventions

- Features live in `src/app/views/<feature>/` (module, routing, component, service, `models/`, `enums/`, `components/`). Shared building blocks live in `src/app/shared/` (components, dialogs, directives, guards, helpers, interceptors, models, pipes, services, validators). Keep the Angular Material look and interaction model.
- Protected view pages extend `PraBaseComponent` (`src/app/shared/components/pra-base/pra-base.component.ts`) instead of duplicating the auth and business unit subscription logic.
- Data-table pages follow `SitesComponent` and `CustomersComponent`: `MatTableDataSource`, `MatSort`, `MatPaginator`, `isLoading`, `filterValue` and one `loadPage()` entry point. List layout rules (flex columns, actions column) are in [AGENTS.md](../AGENTS.md).
- Async flow: component methods use `async/await`; services return `Promise<T>` ([api-services.md](api-services.md)).
- Use the shared dialog services for confirmations, errors and notifications: `ConfirmDialogService`, `ErrorDialogService`, `NotificationDialogService` (`src/app/shared/dialogs/`).
- Views that depend on business unit filtered data apply `PraDataFilter.filterByBusinessUnit` (`src/app/shared/helpers/`) and override `onBusinessUnitChanged()` to reload, instead of subscribing to the auth user again.
- Keep API usage frontend-safe: relative endpoints only, no manual auth headers ([api-services.md](api-services.md)).
- Keep startup authentication aligned with the `APP_INITIALIZER` flow in `src/app/app.module.ts`.
- Do not duplicate domain behaviour in component comments; link to [cache-strategy.md](cache-strategy.md) and [pra-beyondtrust-object-naming.md](pra-beyondtrust-object-naming.md).
- Legacy naming to preserve: the dashboard folder is `src/app/views/dashboard/components/beyondtrust-instaces` (sic, one `n` missing). Do not rename it outside an explicit rename task.

### New feature page checklist

1. Lazy route with `data.roles` and `UserRoleGuard` in `src/app/app.routing.ts`.
2. Navigation entry in `src/app/shared/services/navigation.service.ts`, with the same role filter as the route.
3. i18n keys in `src/assets/i18n/en.json`, named `views.<feature>.<name>`.
4. Feature module, routing, component, service and models under `src/app/views/<feature>/`.
5. Own `<feature>.service.ts` following [api-services.md](api-services.md); there is no global API client.

### Frontend API integration checklist

Use this when a pra-api endpoint is added or changed:

1. Align the contract with pra-api first; mark coupled changes per the [cross-repository contracts](../../docs/knowledge/cross-repo-contracts.md), including rollout order and mixed-version behaviour.
2. Service method, request and response models, relative endpoint, tenant header where needed.
3. Routing, navigation and i18n when the feature needs them.
4. Preserve existing feature semantics. Do not introduce new UI meaning only because a backend field became optional (for example "empty field means keep current value"); where the contract is relaxed, decide explicitly whether the form stays strict.
5. Report: files changed with a one-line purpose, assumed pra-api endpoints, boundary and security checks applied, validation commands run, coupled-change notes for the other repositories.

## 2. Templates, naming and styles

- Naming: component classes in `PascalCase` with the `Component` suffix; template event handlers are verb-based `camelCase` with the `Handler` suffix (`downloadBackupHandler(row)`); booleans start with `is`, `has` or `can`.
- Keep templates declarative. Move non-trivial logic into component methods or helpers.
- Do not call expensive methods from repeated bindings (table rows, lists). Precompute view-model fields in component code and use `trackBy` where identity stability matters.
- User-facing text goes into `src/assets/i18n/en.json` (see the `translate` pipe rule in [AGENTS.md](../AGENTS.md)); do not add hardcoded labels.
- SCSS stays component-scoped: no global leakage, no deep selector chains, class-based selectors, consistent grouping (layout, spacing, state). Reuse shared tokens and existing utilities before adding one-off values.
- No ad-hoc semantic changes to forms or flows unless they follow Angular best practice; document intentional deviations.

## 3. RxJS lifecycle and performance

Lifecycle (hard rule):

- Every manual subscription has a teardown path.
- In components that extend `PraBaseComponent`, add subscriptions to `subscriptionsToClear`; the base class unsubscribes on destroy.
- Components that do not extend the base class implement `OnDestroy` with `takeUntil` (or an equivalent explicit teardown).
- No ad-hoc subscriptions without cleanup.

Stream composition:

- Compose streams instead of nesting subscriptions.
- Choose the mapping operator deliberately: `switchMap` for latest-only request flows, `concatMap` for ordered writes, `exhaustMap` for ignore-while-running actions (polling, see [AGENTS.md](../AGENTS.md)), `mergeMap` only when concurrency is wanted.
- Keep error handling close to the domain boundary. No silent fallback values unless the behaviour is intentional and documented.
- Use `shareReplay` only for intentionally shared streams and define their reset and invalidation.
- Keep side effects in explicit command handlers, not in query streams. Service streams stay transport-focused, component streams UI-focused.
- Reset loading flags on success and on error (`finalize` where it fits).

## 4. Angular upgrade readiness

The application runs Angular 14 and is expected to move up one major at a time (see [modernization-roadmap.md](modernization-roadmap.md)). New code should not raise the migration cost:

- Avoid deprecated Angular APIs and legacy patterns; keep module and routing boundaries explicit and simple.
- Prefer typed reactive forms for new forms; do not extend untyped form usage unless a legacy constraint requires it.
- Keep components and services decoupled from broad shared modules and avoid hidden dependencies, so a later move to standalone components stays cheap.
- Use explicit subscription teardown and avoid fragile async timing assumptions.
- Reduce unbounded `any` in new code; tighten typing in small, low-risk steps. Remove deprecated `tsconfig` options when feasible.
- Upgrade one major at a time. After each bump run type check, lint, production build and the smoke paths below before continuing.

## 5. Quality gates

Required for every functional changeset (CI parity: do not merge a change that fails the type check or the production build):

1. `npm run typecheck`
2. `npm run lint` (read-only, no auto-fix)
3. `npm run build:console`
4. Existing specs stay green: `npx nx test` (Karma, needs `CHROME_BIN`; headless: `npm test -- --watch=false --browsers=ChromeHeadless`)
5. Manual smoke check of the affected paths

Smoke baseline: sign in, sign out and role-based route access; tenant (BeyondTrust instance) selection in the affected views; the create, read, update or delete path touched by the change; error dialogs and notifications on the affected failure paths.

Change safety: small, reviewable changesets; no unrelated refactoring in a bugfix; existing behaviour unchanged unless a bugfix is explicit and documented; intentional behaviour changes go into the commit message.

## 6. Testing

Status: the console is not ready for systematic unit testing (decision by André, 2026-10-07). Do not add new specs unless asked, and keep the existing ones green. Older guidance to add or update unit tests for critical-path changes no longer applies; the verification for a change is the quality gates above and the manual smoke check.

The existing suite (Karma and Jasmine, 12 spec files at the time of writing) stays the baseline. Switching to Jest is a possible later step, only after the baseline is stable and the coverage to preserve is defined (see [modernization-roadmap.md](modernization-roadmap.md)).

When a spec has to be touched or the user asks for one, keep to the style of the existing specs:

- `describe` per unit under test; behaviour-style `it` names that start with a verb ("stores token on successful login"); Arrange, Act, Assert.
- HTTP-based services: `HttpClientTestingModule` and `HttpTestingController`; check method, URL, headers and body; call `httpMock.verify()` in `afterEach`; cover success and failure paths.
- Collaborators (router, dialog services): `jasmine.createSpyObj`, narrow spies; lightweight fakes for storage and state containers.
- Deterministic tests: no uncontrolled time, no real network, no browser navigation or external link clicks; shallow component tests with minimal templates or `NO_ERRORS_SCHEMA`.
- Layer focus: services (side effects on cache or state, contextual error propagation), interceptor (request transformation, error handling), guards (allow and deny, navigation side effects), components (key inputs, outputs, critical state transitions).
- Priority if testing is ever expanded: auth service, interceptor and guards, critical API services; then data-heavy workflows and parsers; presentational components last.
