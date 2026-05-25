---
description: "Use when creating or modifying Angular frontend views, components, templates, and styles in this repo. Covers PRA Console UI patterns, role-aware routing, and shared frontend services."
applyTo: "src/app/**/*.ts, src/app/**/*.html, src/app/**/*.scss"
---
# PRA Console Frontend Patterns

- Use existing conventions from [src/app/views](../../src/app/views) and shared building blocks from [src/app/shared](../../src/app/shared). Preserve the current Angular Material based style and interaction model.
- This instruction applies to both feature views and shared frontend utilities (for example helpers, pipes, directives, and reusable components in [src/app/shared](../../src/app/shared)).
- For protected view pages, extend [PraBaseComponent](../../src/app/shared/components/pra-base/pra-base.component.ts) instead of duplicating auth/business-unit subscription logic.
- For data-table pages, follow the existing pattern used in [SitesComponent](../../src/app/views/sites/sites.component.ts) and [CustomersComponent](../../src/app/views/customers/customers.component.ts): `MatTableDataSource`, `MatSort`, `MatPaginator`, `isLoading`, `filterValue`, and a single `loadPage()` entry point.
- Keep async flow consistent: component methods use async/await, services return `Promise<T>` backed by `firstValueFrom(...)`.
- RxJS lifecycle management is a hard rule:
  - In components, every manual subscription must be added to `subscriptionsToClear` and cleaned up via base teardown.
  - Do not leave ad-hoc subscriptions without teardown paths.
  - Use `onBusinessUnitChanged()` for reactive reload behavior instead of duplicating auth-user subscriptions.
  - Components that do not extend `PraBaseComponent` must implement an explicit teardown pattern (`takeUntil` + `OnDestroy` or equivalent).
- Use shared dialog services for UX consistency:
  - [ConfirmDialogService](../../src/app/shared/dialogs/confirm-dialog/confirm-dialog.service.ts)
  - [ErrorDialogService](../../src/app/shared/dialogs/error-dialog/error-dialog.service.ts)
  - [NotificationDialogService](../../src/app/shared/dialogs/notification-dialog/notification-dialog.service.ts)
- When a view depends on business unit filtered data, apply [PraDataFilter.filterByBusinessUnit](../../src/app/shared/helpers) and implement `onBusinessUnitChanged()` to refresh data.
- Keep API usage frontend-safe:
  - Always call relative endpoints (for example `"sites"`, `"auth/profile"`).
  - Never set API auth headers manually in components/services; [ApiInterceptor](../../src/app/shared/interceptors/api.interceptor.ts) handles this.
- For new feature pages, implement the complete frontend integration:
  - Add lazy route with `data.roles` and `UserRoleGuard` in [src/app/app.routing.ts](../../src/app/app.routing.ts).
  - Add navigation entry in [src/app/shared/services/navigation.service.ts](../../src/app/shared/services/navigation.service.ts).
  - Add i18n keys in [src/assets/i18n/en.json](../../src/assets/i18n/en.json).
- Enforce stricter template and style conventions:
  - Naming:
    - Component classes: `PascalCase` with `Component` suffix.
    - Template event handlers: verb-based `camelCase` with `Handler` suffix for UI actions.
    - Booleans: prefix with `is`, `has`, or `can`.
  - Template structure:
    - Keep templates declarative; move non-trivial logic into component methods/helpers.
    - Avoid calling expensive methods directly from table/list templates. Precompute view-model values in component code when possible.
    - Prefer translation keys for user-facing text; avoid introducing new hardcoded UI labels when an i18n key is appropriate.
    - New feature keys should follow `views.<feature>.<name>` naming.
  - SCSS structure:
    - Keep styles component-scoped; avoid global leakage and deep selector chains.
    - Prefer class-based selectors and consistent block grouping (layout, spacing, state).
    - Reuse shared tokens and existing style utilities before adding new one-off values.
- Do not duplicate deep domain behavior docs in component comments. Link to:
  - [docs/cache-strategy.md](../../docs/cache-strategy.md)
  - [docs/pra-beyondtrust-object-naming.md](../../docs/pra-beyondtrust-object-naming.md)

## Change Safety Expectations

- Prefer small, reviewable changesets over broad refactors.
- Keep existing behavior unchanged unless a bugfix is explicit and documented.
- After changing frontend flows, validate key smoke paths manually (login, role-based navigation, affected feature CRUD path).
