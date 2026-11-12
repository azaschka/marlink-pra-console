# Console Cache Strategy

> **Purpose for AI Agents:** This document is the canonical reference for every in-memory caching mechanism in the PRA Admin Console (`pra-console`). Read this before adding, modifying, or debugging any data-loading logic in the Angular frontend.

---

## 1. Why Caching Exists

The Console talks to the PRA API over HTTPS for every piece of data it displays. Many resources (jump groups, jump policies, jumpoints, session policies, group policies, customers) are:

- **Expensive to fetch**: they may involve downstream calls from the PRA API to the PRA Sync API (and ultimately to BeyondTrust).
- **Reused across many components**: the same list is needed by dropdowns in create/update overlays, filter panes, and list views.
- **Slow to change**: these are configuration objects that a human operator changes infrequently, not real-time data.

Without a cache, opening a single dialog (e.g. *Create Jump Asset*) would fire 3 to 5 simultaneous API calls for the same data, every single time.

---

## 2. Cache Implementations

### 2.1 `TenantCache<T>`: generic reusable helper

**File:** `src/app/shared/helpers/tenant-cache.ts`

A typed, Promise-deduplicating cache designed specifically for tenant-scoped data.

| Property | Value |
|---|---|
| **TTL** | `TenantCache.DEFAULT_TTL_MS` = **30 minutes** |
| **Key type** | `string \| number` (converted to `String(key)` internally) |
| **On rejection** | Entry removed → next caller triggers a clean retry |
| **On empty `[]`** | Entry removed immediately (see §4, Hardening) |
| **Concurrent calls** | Same in-flight `Promise` is returned → single HTTP request |

**Usage pattern:**

```typescript
return this.cache.get(cacheKey, async () => {
    const result = await firstValueFrom(this.http.get<T[]>(endpoint, options));
    if (result.length === 0) {
        this.cache.invalidate(cacheKey);   // never freeze an empty dataset
    }
    return result;
});
```

**Invalidation API:**

```typescript
this.cache.invalidate();          // flush the entire cache
this.cache.invalidate(tenantId);  // flush one tenant's entry
this.cache.invalidate(compositeKey); // flush one composite entry
```

---

### 2.2 `CustomerCacheService`: custom Map-based cache

**File:** `src/app/views/customers/customer-cache.service.ts`

Customers are used in 18+ places across 11 feature modules, so they get a dedicated singleton service (rather than a bare `TenantCache`) with its own `Map<string, CacheEntry>`.

| Property | Value |
|---|---|
| **TTL** | `CustomerCacheService.TTL_MS` = **30 minutes** |
| **Key** | `JSON.stringify({ businessUnits: [...].sort() \| null })` |
| **On rejection** | Entry deleted via `.catch()` |
| **On empty `[]`** | Entry deleted via `.then()` (see §4, Hardening) |
| **Concurrent calls** | Same in-flight `Promise` is returned → single HTTP request |

---

## 3. Cached Resources: Inventory

### 3.1 Jump Groups

| | |
|---|---|
| **Service** | `src/app/views/jump-groups/jump-groups.service.ts` |
| **Cache** | `TenantCache<JumpGroup[]>`, field `cache` |
| **Cache key** | `tenantId` (number) |
| **Endpoint** | `GET jump-groups?pageSize=9999` + `X-Tenant-Id` |
| **Read method** | `fetchJumpGroups(tenantId)` |
| **Write invalidation** | `updateJumpGroup()` → `cache.invalidate(tenantId)` |
| | `deleteJumpGroup()` → `cache.invalidate(tenantId)` |
| **Instance-change invalidation** | `cache.invalidate()` (full flush) via `selectedInstanceId$` |
| **Empty-result handling** | Cache entry discarded; next open re-fetches |
| **Data source** | PRA API → PRA Sync API → BeyondTrust local DB |
| **Why empty is possible** | Sync has not run yet, or BeyondTrust has no jump groups |

---

### 3.2 Jump Policies

| | |
|---|---|
| **Service** | `src/app/views/jump-policies/jump-policies.service.ts` |
| **Cache** | `TenantCache<JumpPolicy[]>`, field `cache` |
| **Cache key** | `tenantId` (number) |
| **Endpoint** | `GET jump-policies?pageSize=9999` + `X-Tenant-Id` |
| **Read method** | `fetchJumpPolicies(tenantId)` |
| **Write invalidation** | None (jump policies are read-only in the Console) |
| **Instance-change invalidation** | `cache.invalidate()` (full flush) via `selectedInstanceId$` |
| **Empty-result handling** | Cache entry discarded; next open re-fetches |
| **Data source** | PRA API → PRA Sync API → BeyondTrust local DB |
| **Why empty is possible** | Sync has not run yet, or BeyondTrust has no jump policies |

---

### 3.3 Jumpoints

| | |
|---|---|
| **Service** | `src/app/views/jumpoints/jumpoints.service.ts` |
| **Cache** | `TenantCache<Jumpoint[]>`, field `cache` |
| **Cache key** | `tenantId` (number) |
| **Endpoint** | `GET jumpoints?pageSize=9999` + `X-Tenant-Id` |
| **Read method** | `fetchJumpoints(tenantId)` |
| **Write invalidation** | `deleteJumpoint()` → `cache.invalidate(tenantId)` |
| **Instance-change invalidation** | `cache.invalidate()` (full flush) via `selectedInstanceId$` |
| **Empty-result handling** | Cache entry discarded; next open re-fetches |
| **Data source** | PRA API → PRA Sync API → BeyondTrust local DB |
| **Why empty is possible** | Sync has not run yet, or no jumpoints configured |

---

### 3.4 Session Policies

| | |
|---|---|
| **Service** | `src/app/views/session-policies/session-policies.service.ts` |
| **Cache** | `TenantCache<SessionPolicy[]>`, field `cache` |
| **Cache key** | `tenantId` when no params; `"${tenantId}::${sortedParamsJson}"` otherwise |
| **Endpoint** | `GET session-policies?pageSize=9999[&displayName=...&codeName=...&codeNamePatterns=...]` + `X-Tenant-Id` |
| **Read method** | `fetchSessionPolicies(tenantId, params?)` |
| **Write invalidation** | None (session policies are read-only in the Console) |
| **Instance-change invalidation** | `cache.invalidate()` (full flush) via `selectedInstanceId$` |
| **Empty-result handling** | Cache entry discarded; next open re-fetches |
| **Data source** | PRA API → PRA Sync API → BeyondTrust local DB (`session_policies_{tenantId}` table) |
| **Why empty is possible** | Discrepancy sync has not run yet; or all sync attempts failed because BeyondTrust returned `description: null` (fixed in pra-sync-api v2+) |
| **Note** | Supports composite cache keys for filtered calls (e.g. filtered by `codeNamePatterns`). Each unique filter combination gets its own cache entry. |

---

### 3.5 Group Policies

| | |
|---|---|
| **Service** | `src/app/views/group-policies/group-policies.service.ts` |
| **Cache A** | `TenantCache<GroupPolicy[]>`, field `policiesCache` |
| **Cache A key** | `tenantId` (number) |
| **Cache A endpoint** | `GET group-policies?pageSize=9999` + `X-Tenant-Id` |
| **Cache A read method** | `fetchGroupPolicies(tenantId)` |
| **Cache A write invalidation** | `deleteGroupPolicy()` → `policiesCache.invalidate(tenantId)` |
| **Cache B** | `TenantCache<GroupPolicyMember[]>`, field `membersCache` |
| **Cache B key** | `"${tenantId}_${groupPolicyId}"` (composite) |
| **Cache B endpoint** | `GET group-policies/{id}/members?pageSize=9999` + `X-Tenant-Id` |
| **Cache B read method** | `fetchGroupPolicyMembers(tenantId, groupPolicyId)` |
| **Cache B write invalidation** | `addMemberToGroupPolicy()` → `membersCache.invalidate(cacheKey)` |
| | `removeMemberFromGroupPolicy()` → `membersCache.invalidate(cacheKey)` |
| **Both caches, instance-change** | `policiesCache.invalidate()` + `membersCache.invalidate()` via `selectedInstanceId$` |
| **Empty-result handling** | Cache entry discarded for both caches; next open re-fetches |
| **Data source** | PRA API → PRA Sync API → BeyondTrust local DB |
| **Why empty is possible** | Sync has not run yet; or BeyondTrust has no group policies for this tenant |

---

### 3.6 Customers

| | |
|---|---|
| **Service** | `src/app/views/customers/customer-cache.service.ts` |
| **Cache** | Custom `Map<string, CacheEntry>` |
| **Cache key** | `JSON.stringify({ businessUnits: [...sorted] \| null })` |
| **Endpoint** | `GET customers?pageSize=9999[&businessUnits=...]` (delegated to `CustomersService`) |
| **Read method** | `fetchCustomers(filters?)` |
| **Write invalidation** | `invalidate()` must be called manually after any customer mutation (create / modify / delete / deactivate / reactivate) |
| **Instance-change invalidation** | `invalidate()` (full flush) via `selectedInstanceId$` |
| **Empty-result handling** | Cache entry deleted; next call re-fetches |
| **Data source** | PRA API → local MariaDB (`pra_customers` table) |
| **Why empty is possible** | No customers have been created yet for the selected BT instance / BU |

---

## 4. Hardening: Never Cache an Empty Array

### The Problem

All these resources are populated by an asynchronous backend process (BeyondTrust sync or customer creation). On first boot, or after a system migration, the dataset may legitimately be empty. If `[]` is cached for 30 minutes, the user sees empty dropdowns even after the backend data becomes available, with no way to refresh short of waiting for the TTL to expire or switching instances.

### The Rule

> **Every fetch method that returns `T[]` must discard the cache entry if the result is an empty array.**

This means the cache's TTL only protects non-empty data. An empty result is never stored. The next open always issues a fresh HTTP request.

### Pattern for `TenantCache`-based Services

```typescript
public fetchItems(tenantId: number): Promise<Item[]> {
    return this.cache.get(tenantId, async () => {
        const result = await firstValueFrom(
            this.http.get<Item[]>("items", {
                params: new HttpParams().set("pageSize", "9999"),
                ...this.createHeaders(tenantId),
            }),
        );
        // ↓ Never freeze an empty dataset in the cache
        if (result.length === 0) {
            this.cache.invalidate(tenantId);
        }
        return result;
    });
}
```

### Pattern for `CustomerCacheService` (Map-based)

```typescript
const promise = this.customersService
    .fetchCustomers({ ...filters, pageSize: PAGE_SIZE })
    .then((result) => {
        if (result.length === 0) {
            this.cache.delete(key); // never freeze an empty dataset
        }
        return result;
    })
    .catch((err) => {
        this.cache.delete(key);
        throw err;
    });
```

### Why `invalidate()` Inside the Fetcher Is Safe

`TenantCache.get()` stores the `Promise` immediately (before it resolves), so the cache entry exists from the moment the request starts. When the resolved result is `[]`, the `invalidate()` call removes that entry. Any *already-in-flight* concurrent callers receive the same Promise and still get `[]` as their result. They just won't find a cached entry on their *next* call. This is exactly the intended behaviour.

---

## 5. Invalidation Summary

| Trigger | Affected caches |
|---|---|
| BeyondTrust instance switched | **All** (full flush on every service) |
| `deleteJumpGroup()` | `JumpGroupsService.cache` (tenant-scoped) |
| `updateJumpGroup()` | `JumpGroupsService.cache` (tenant-scoped) |
| `deleteJumpoint()` | `JumpointsService.cache` (tenant-scoped) |
| `deleteGroupPolicy()` | `GroupPoliciesService.policiesCache` (tenant-scoped) |
| `addMemberToGroupPolicy()` | `GroupPoliciesService.membersCache` (composite key) |
| `removeMemberFromGroupPolicy()` | `GroupPoliciesService.membersCache` (composite key) |
| Any customer mutation | `CustomerCacheService.cache` (full flush via `invalidate()`) |
| Empty API response | Entry discarded (all services, all caches) |
| HTTP error | Entry discarded (all services, all caches) |
| TTL expiry (30 min) | Entry silently replaced on next call |

---

## 6. Rules for Adding New Cached Services

When introducing a new service that fetches a list from the API, follow this checklist:

- [ ] Use `TenantCache<T[]>` (or follow the `CustomerCacheService` pattern for complex key logic).
- [ ] Subscribe to `AppService.selectedInstanceId$.pipe(distinctUntilChanged(), skip(1))` and call `cache.invalidate()` on emission.
- [ ] Use `async () =>` in the `cache.get()` fetcher to enable `await` + empty-check.
- [ ] After every successful fetch, check `result.length === 0` and call `cache.invalidate(key)` if true.
- [ ] Call `cache.invalidate(key)` after every write operation (POST / PATCH / DELETE) that changes the cached resource.
- [ ] Document the new cache in this file under §3.

---

## 7. Known Limitations

| Limitation | Status |
|---|---|
| Cache is **in-memory only**: a page refresh clears everything | By design; avoids stale data across sessions |
| Cache TTL is **not configurable per-resource**: all use 30 min | Acceptable: all resources have similar staleness tolerance |
| **No real-time push**: changes made by other operators are invisible until TTL expires or instance is switched | Known gap; would require WebSocket integration to fix |
| Empty-result bypass means **one extra HTTP call** is always made if data doesn't exist yet | Acceptable cost; prevents showing stale `[]` after sync |
