---
description: "Use when creating or modifying API-facing Angular services and auth flows in this repo. Covers HTTP error propagation, context wrapping, and when to handle vs rethrow errors."
applyTo: "src/app/**/*.service.ts"
---
# PRA Console API Error Handling Patterns

- Scope and strictness:
  - These rules are hard requirements for all service files under [src/app](../../src/app).
  - Apply them across feature and shared services to keep behavior consistent during Angular version migration.
- Default behavior in API services: let HttpClient errors bubble to the caller. Components handle user-facing messaging with dialogs and notifications.
- Do not swallow errors in service methods by returning silent fallbacks such as empty arrays, null, or void after failed HTTP calls.
- Do not convert transport/domain errors into UI-formatted markup (for example HTML strings). Keep service errors plain and contextual.
- Catch errors in services only when one of these is required:
  - Cleanup or cache consistency, then rethrow.
  - Add operation context to the error, then rethrow.
  - Intentional best-effort batch behavior where failures are logged and the loop continues.
- Use a standardized propagation format when rethrowing:
  - Throw Error objects only (never strings or plain objects).
  - Use method-scoped context in the message, for example `[CustomersService.fetchCustomers] Failed to load customers`.
  - Preserve original details by including the source message when available.
  - Keep the original failure path observable by callers (no hidden catches without rethrow).
- Keep authentication-specific handling centralized:
  - [ApiInterceptor](../../src/app/shared/interceptors/api.interceptor.ts) handles 401 signout behavior for non-login requests.
  - Auth lifecycle exceptions remain in [jwt-auth.service.ts](../../src/app/shared/services/auth/jwt-auth.service.ts), where signout and startup initialization logic are deliberate.
- For cache-enabled services, failure paths must invalidate rejected entries before rethrowing, following existing patterns in [customer-cache.service.ts](../../src/app/views/customers/customer-cache.service.ts) and [tenant-cache.ts](../../src/app/shared/helpers/tenant-cache.ts).
- Keep responsibilities split:
  - Services manage transport, headers, params, and data retrieval.
  - Components decide how to present errors to users, for example in [customers.component.ts](../../src/app/views/customers/customers.component.ts).
- If a method intentionally continues after per-item failures, document that behavior with a short comment and ensure errors are still observable in logs.

## Auth and Session Specific Rule

- If auth validation fails in auth services, clear stale session state and rethrow a contextual Error unless startup init explicitly requires silent cleanup.

## Snippet Templates

- Standard rethrow with method context:

```typescript
public async fetchCustomers(): Promise<Customer[]> {
  try {
    return await firstValueFrom(this.http.get<Customer[]>("customers"));
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[CustomersService.fetchCustomers] Failed to load customers: ${detail}`,
    );
  }
}
```

- Cache cleanup plus rethrow:

```typescript
public async fetchGroupPolicies(tenantId: number): Promise<GroupPolicy[]> {
  return this.cache.get(tenantId, async () => {
    try {
      return await firstValueFrom(
        this.http.get<GroupPolicy[]>("group-policies", {
          ...this.createHeaders(tenantId),
        }),
      );
    } catch (err: unknown) {
      this.cache.invalidate(tenantId);
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[GroupPoliciesService.fetchGroupPolicies] Failed to load group policies: ${detail}`,
      );
    }
  });
}
```

- Intentional best-effort batch (continue on item failure):

```typescript
public async removeAgents(ids: number[]): Promise<void> {
  // Intentional best-effort: continue processing remaining IDs when one fails.
  for (const id of ids) {
    try {
      await this.removeAgent(id);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`[MigrationService.removeAgents] Failed for id=${id}: ${detail}`);
    }
  }
}
```
