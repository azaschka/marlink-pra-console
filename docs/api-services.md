# API services, error handling and runtime configuration

Conventions for everything that talks to pra-api: Angular services, the central interceptor, error propagation and the runtime configuration that feeds it. Hard rules are summarised in [AGENTS.md](../AGENTS.md); this document holds the detail and the templates.

Scope: all `*.service.ts` files under `src/app` (feature services in `src/app/views/<feature>/`, shared services in `src/app/shared/services/`). The rules describe the target convention for new and changed code; existing services may still deviate, so check the neighbouring service before copying it.

Related: [cache-strategy.md](cache-strategy.md) (caches and invalidation), [frontend-patterns.md](frontend-patterns.md) (components, RxJS, routing), [cross-repository contracts](../../docs/knowledge/cross-repo-contracts.md) (workspace checklist for contract changes).

## 1. System boundaries

- The console is the UI layer. It talks to pra-api only. It never calls pra-sync-api or BeyondTrust directly, and it never invents a protocol of its own.
- When a service call needs a new field, filter or header, align the pra-api contract first (see the cross-repository checklist). Prefer backwards compatible UI model changes; if a breaking pra-api change is required, document the dependency and the rollout order.
- Route role checks (`src/app/app.routing.ts`) and navigation role filtering (`src/app/shared/services/navigation.service.ts`) must stay aligned whenever permissions change. `canManagePraUsers` is a special string permission, not an `AuthRole` value.
- The UI hides or disables actions for convenience only. pra-api enforces every rule.

## 2. Central API interceptor

`src/app/shared/interceptors/api.interceptor.ts` is the only place that composes URLs and authentication headers. Behaviour to preserve:

- Requests whose URL contains `/assets` pass through untouched.
- The API base URL is prepended to relative endpoints (unless already present).
- `x-api-key` and `x-access-key` are added to every API request; `Authorization: Bearer <jwt>` is added when a token exists.
- A `401` on any endpoint other than `auth/login` signs the user out. On `auth/login` a `401` means wrong credentials and is handled by the sign-in component.

Consequences for services:

- Use relative endpoints only (`"sites"`, `"auth/profile"`, `` `group-policies/${id}` ``). Never prepend the base URL.
- Never set API key, access key or JWT headers in a service or component.
- Auth lifecycle exceptions (sign-out, startup initialisation) stay in `src/app/shared/services/auth/jwt-auth.service.ts`.

## 3. Service pattern

- Services are Promise based: return `Promise<T>` through `firstValueFrom(this.http.<verb>(...))`.
- Always `await` and return mutation calls (create, update, delete) so failures reach the caller.
- Tenant-scoped resources send `X-Tenant-Id` in the request options, built by a local helper (for example `createHeaders(tenantId)`). The header carries the BeyondTrust instance id, never a customer id.
- Build query strings with `HttpParams`; use `append` for repeated keys when pra-api expects them.
- Type responses explicitly. Avoid `any` unless no stable DTO exists yet.
- A service performs transport and mapping only. Components coordinate UX state, dialogs and notifications.
- Canonical examples: `src/app/views/customers/customers.service.ts`, `sites/sites.service.ts`, `session-policies/session-policies.service.ts`, `group-policies/group-policies.service.ts`.

### Caching in services

Full rules and the inventory of cached resources are in [cache-strategy.md](cache-strategy.md). In short, for `TenantCache` (`src/app/shared/helpers/tenant-cache.ts`):

- Invalidate everything when the selected BeyondTrust instance changes.
- Invalidate the affected keys immediately after a successful create, update, delete, add member or remove member.
- Never cache an empty array for sync-driven resources.
- On a failed fetch, invalidate the rejected entry before rethrowing.

## 4. Error handling contract

Default: let `HttpClient` errors bubble to the caller. Components decide how to present them with the shared dialog and notification services.

Do not:

- swallow errors with silent fallbacks (empty array, `null`, `void`) after a failed HTTP call;
- turn errors into UI markup (for example HTML strings); service errors stay plain and contextual.

A service may catch an error only to

1. clean up (cache consistency) and rethrow,
2. add operation context and rethrow, or
3. run an intentional best-effort batch where failures are logged and the loop continues (document this with a short comment; the failure must stay observable in the log).

When rethrowing:

- throw `Error` objects only, never strings or plain objects;
- prefix the message with the method scope, for example `[CustomersService.fetchCustomers] Failed to load customers: <detail>`;
- include the original message when available;
- never catch without rethrow unless case 3 applies.

Auth services: if validation fails, clear the stale session state and rethrow a contextual `Error`, unless startup initialisation explicitly needs silent cleanup.

`ErrorUtils.extractMessages` (`src/app/shared/helpers/error-utils.ts`) flattens nested pra-api error payloads into a list of messages; use it when a readable message is needed instead of parsing payloads by hand.

### Templates

Standard rethrow with method context:

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

Cache cleanup, then rethrow:

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

Intentional best-effort batch (continue on item failure):

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

## 5. Runtime configuration and secrets

Runtime configuration enters the application through the container, never through committed constants.

| Layer | File | Role |
|---|---|---|
| Template | `src/assets/scripts/env.template.js` | Placeholders `PRA_API_BASE_URL`, `PRA_API_KEY`, `PRA_ACCESS_KEY` |
| Container start | `Dockerfile` | `envsubst` renders the template to `assets/scripts/env.js` |
| Local development | `scripts/generate-local-env.sh` | Renders `env.js` from `PRA_DEV_API_BASE_URL` (default `/api`), `PRA_DEV_API_KEY`, `PRA_DEV_ACCESS_KEY` |
| Environment files | `src/environments/environment.ts`, `environment.prod.ts` | Read `window["env"]` (development with safe fallbacks) |
| Mapping | `src/config.ts` | Exposes `praApiBaseUrl`, `praApiKey`, `praAccessKey` and role lists to the app |

Rules:

- Never commit secrets, passwords, API keys, tokens or proxy credentials. A generated `src/assets/scripts/env.js` is git-ignored; keep it that way.
- Local keys come from the shell environment. Prefer macOS Keychain-backed exports over plaintext exports in shell profiles. `scripts/check-local-env.sh` aborts when `PRA_DEV_API_KEY` or `PRA_DEV_ACCESS_KEY` is missing; run it (via `npm run env:generate`) before generating the file.
- Docker publish: `npm run docker:login:marlink` logs in with `--password-stdin`. Supply `DOCKER_MARLINK_USER` and `DOCKER_MARLINK_PASSWORD` through the environment, or let the script prompt. They never enter committed files.
- Dev proxy (`proxy.dev.conf.js`): set `CORPORATE_PROXY_URL` or `HTTPS_PROXY`; never hardcode proxy credentials.
- If a secret is committed by accident, rotate it immediately and remove it from the history if the policy requires it. Call out security-relevant changes explicitly in the commit message or review notes.
- Startup authentication is bootstrapped through `APP_INITIALIZER` in `src/app/app.module.ts`; keep that flow intact.
