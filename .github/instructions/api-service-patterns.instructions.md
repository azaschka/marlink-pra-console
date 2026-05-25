---
description: "Use when creating or modifying API-facing Angular services in this repo. Covers HttpClient request patterns, tenant headers, Promise style, and cache invalidation rules."
applyTo: "src/app/**/*.service.ts"
---
# PRA Console API Service Patterns

- Scope and strictness:
  - This instruction is a hard requirement for all service files under [src/app](../../src/app), including feature services in [src/app/views](../../src/app/views) and shared services in [src/app/shared/services](../../src/app/shared/services).
  - Apply these rules consistently during ongoing Angular migration work; do not introduce local style variants.
- Keep API service methods Promise-based and consistent with existing code: return Promise<T> via firstValueFrom(HttpClient call).
- Always await and return mutation calls (`create`, `update`, `delete`) so failures propagate to callers.
- Use relative endpoints only, such as sites, customers, auth/profile, and group-policies/123. Do not prepend PRA API base URL in services.
- Do not set API key, access key, or JWT headers manually in services. Request auth headers are handled by [ApiInterceptor](../../src/app/shared/interceptors/api.interceptor.ts).
- For tenant-scoped resources, include X-Tenant-Id headers in the request options from a local helper method.
- Build query strings with HttpParams, including repeated filters via append when the API expects repeated keys.
- Keep write methods explicit and invalidate related caches immediately after successful mutation.
- When using [TenantCache](../../src/app/shared/helpers/tenant-cache.ts):
  - Invalidate all entries when selectedInstanceId changes.
  - Invalidate targeted keys after create, update, delete, add member, or remove member operations.
  - Do not cache empty array results for sync-driven resources.
- Keep service responsibilities narrow:
  - Services perform transport and mapping logic.
  - Components coordinate UX state, dialogs, and notifications.
- Keep response typing explicit. Avoid `any` for API responses unless there is no stable DTO shape yet.
- Do not format service errors as HTML strings. Return plain contextual Error messages and let UI render them.
- Follow standardized error propagation rules from [api-error-handling-patterns.instructions.md](./api-error-handling-patterns.instructions.md) when adding catch/rethrow logic.
- Use existing API services as canonical patterns:
  - [src/app/views/customers/customers.service.ts](../../src/app/views/customers/customers.service.ts)
  - [src/app/views/sites/sites.service.ts](../../src/app/views/sites/sites.service.ts)
  - [src/app/views/session-policies/session-policies.service.ts](../../src/app/views/session-policies/session-policies.service.ts)
  - [src/app/views/group-policies/group-policies.service.ts](../../src/app/views/group-policies/group-policies.service.ts)
- Link to domain cache guidance instead of duplicating it in service comments: [docs/cache-strategy.md](../../docs/cache-strategy.md).

## Validation Expectations for Service Changes

- Run `npm run typecheck` and `npm run lint` after service changes.
- Run `npm run build:console` for integration confidence.
- Add or update service unit tests when changing auth, tenant-header, error propagation, or cache invalidation behavior.
