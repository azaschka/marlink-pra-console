/**
 * Lightweight, generic in-memory cache designed for tenant-scoped Angular
 * services that call a BeyondTrust API with an `X-Tenant-Id` header.
 *
 * ## Features
 *
 * | Scenario                              | Behaviour                                  |
 * |---------------------------------------|--------------------------------------------|
 * | Cache hit (not expired)               | Returns existing Promise — zero HTTP I/O   |
 * | Concurrent calls with the same key    | Returns the same in-flight Promise (dedup) |
 * | Cache miss / expired entry            | Calls `fetcher`, stores & returns Promise  |
 * | `fetcher` rejects                     | Entry removed so next call retries cleanly |
 *
 * ## TTL
 *
 * The default TTL is {@link TenantCache.DEFAULT_TTL_MS} (30 minutes).
 * This is deliberately conservative: well below the 4-hour JWT renewal
 * window while still eliminating the repeated identical requests that occur
 * during normal tab-switching navigation.
 *
 * ## Usage inside an Angular service
 *
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class JumpGroupsService {
 *     private readonly cache = new TenantCache<JumpGroup[]>();
 *
 *     constructor(
 *         private readonly http: HttpClient,
 *         appService: AppService,
 *     ) {
 *         // Flush the entire cache when the operator switches BT instance.
 *         appService.selectedInstanceId$
 *             .pipe(distinctUntilChanged(), skip(1))
 *             .subscribe(() => this.cache.invalidate());
 *     }
 *
 *     // Reads go through the cache — call sites are unchanged.
 *     public fetchJumpGroups(tenantId: number): Promise<JumpGroup[]> {
 *         return this.cache.get(tenantId, () =>
 *             firstValueFrom(this.http.get<JumpGroup[]>('jump-groups', ...)),
 *         );
 *     }
 *
 *     // Mutations invalidate only the affected tenant's entry.
 *     public async deleteJumpGroup(tenantId: number, id: number): Promise<void> {
 *         await firstValueFrom(this.http.delete(...));
 *         this.cache.invalidate(tenantId);
 *     }
 * }
 * ```
 *
 * ## Composite keys
 *
 * When a resource is scoped by both tenant **and** another identifier
 * (e.g. `groupPolicyId`), pass a composite string key:
 *
 * ```typescript
 * private readonly membersCache = new TenantCache<GroupPolicyMember[]>();
 *
 * public fetchMembers(tenantId: number, policyId: number): Promise<GroupPolicyMember[]> {
 *     return this.membersCache.get(`${tenantId}_${policyId}`, () => ...);
 * }
 *
 * public async addMember(tenantId: number, policyId: number, ...): Promise<void> {
 *     await firstValueFrom(...);
 *     this.membersCache.invalidate(`${tenantId}_${policyId}`);
 * }
 * ```
 */

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
    /**
     * The in-flight **or** already-resolved Promise for this key.
     *
     * Storing the Promise directly (rather than the resolved value) gives
     * in-flight deduplication for free: all concurrent callers with the same
     * key receive the same object and therefore share one HTTP request, even
     * before it resolves.
     */
    promise: Promise<T>;

    /**
     * Absolute timestamp (ms since epoch) after which this entry is stale.
     *
     * The expiry is stamped at the moment the request is initiated, not when
     * it resolves.  For a 30-minute TTL the difference is negligible in
     * practice, and this avoids a second Map write after every response.
     */
    expiresAt: number;
}

// ---------------------------------------------------------------------------
// TenantCache
// ---------------------------------------------------------------------------

export class TenantCache<T> {
    // ------------------------------------------------------------------
    // Constants
    // ------------------------------------------------------------------

    /**
     * Default time-to-live in milliseconds (30 minutes).
     *
     * Exposed as a public constant so unit tests can reference it without
     * hard-coding the magic number.
     */
    public static readonly DEFAULT_TTL_MS = 30 * 60 * 1_000;

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------

    private readonly store = new Map<string, CacheEntry<T>>();

    // ------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------

    /**
     * @param ttlMs  Optional custom TTL in milliseconds.
     *               Defaults to {@link TenantCache.DEFAULT_TTL_MS}.
     */
    constructor(private readonly ttlMs = TenantCache.DEFAULT_TTL_MS) {}

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * Returns the cached `Promise<T>` for `key` when the entry is still
     * within its TTL window; otherwise calls `fetcher` to create a fresh
     * request, stores it under `key`, and returns it.
     *
     * Concurrent callers that arrive while a request is already in flight
     * (i.e. `entry.promise` is pending but `entry.expiresAt` is still in the
     * future) automatically receive the same Promise without issuing a second
     * HTTP request.
     *
     * @param key      Cache key.  Typically a `tenantId` number, but any
     *                 `string` is accepted for composite keys such as
     *                 `"${tenantId}_${resourceId}"`.
     * @param fetcher  Zero-argument factory that returns the `Promise<T>` to
     *                 store.  Only called on a cache miss or expired entry.
     */
    public get(key: string | number, fetcher: () => Promise<T>): Promise<T> {
        const k = String(key);
        const entry = this.store.get(k);

        // Valid hit: covers both a resolved Promise and an in-flight one.
        if (entry !== undefined && Date.now() < entry.expiresAt) {
            return entry.promise;
        }

        // Cache miss or stale — start a new request.
        const promise = fetcher().catch((err: unknown) => {
            // On rejection, remove the entry so that the next caller
            // triggers a clean retry instead of receiving the same error.
            this.store.delete(k);
            throw err;
        });

        this.store.set(k, {
            promise,
            expiresAt: Date.now() + this.ttlMs,
        });

        return promise;
    }

    /**
     * Removes cache entries.
     *
     * - Called **with** a `key`: removes only that entry.  Use this after a
     *   targeted mutation (e.g. deleting a single resource for one tenant) to
     *   avoid unnecessarily busting the cache for other tenants.
     *
     * - Called **without** a `key`: clears the entire cache.  Use this when
     *   the broader context changes and all entries should be considered stale
     *   (e.g. the selected BeyondTrust instance changes).
     *
     * @param key  Optional cache key to remove.
     */
    public invalidate(key?: string | number): void {
        if (key !== undefined) {
            this.store.delete(String(key));
        } else {
            this.store.clear();
        }
    }

    // ------------------------------------------------------------------
    // Introspection (useful for unit tests)
    // ------------------------------------------------------------------

    /**
     * Returns the number of entries currently held in the cache,
     * including in-flight and expired-but-not-yet-invalidated ones.
     *
     * Intended for use in unit tests; production code should not need this.
     */
    public get size(): number {
        return this.store.size;
    }
}
