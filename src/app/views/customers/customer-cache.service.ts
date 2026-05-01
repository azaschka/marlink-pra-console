import { Injectable } from "@angular/core";
import { distinctUntilChanged, skip } from "rxjs/operators";

import { AppService } from "../../app.service";
import { CustomersService } from "./customers.service";
import { Customer } from "./models";
import { CustomerBusinessUnit } from "./enums";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** Filters accepted by the public API. Pagination is handled internally. */
export interface CustomerFetchFilters {
    businessUnits?: CustomerBusinessUnit[];
}

interface CacheEntry {
    /**
     * The in-flight or already-resolved Promise for this cache key.
     *
     * Storing the Promise (rather than the resolved data) gives us
     * in-flight deduplication for free: concurrent callers with the same
     * filters all receive the same Promise and therefore share a single
     * HTTP request, even before it resolves.
     */
    promise: Promise<Customer[]>;

    /**
     * Absolute timestamp (ms since epoch) after which this entry is
     * considered stale.  Set at the moment the request is initiated, not
     * when it resolves, so the TTL window starts from the first call.
     */
    expiresAt: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Application-wide in-memory cache for customer data.
 *
 * ## Why this service exists
 *
 * `CustomersService.fetchCustomers()` is called from 18+ places across
 * 11 feature modules, each of which previously held its own service instance
 * with no shared state.  Every component load, BU filter change, or dialog
 * open triggered a fresh HTTP request — even when the data had not changed.
 *
 * This service is the single source-of-truth for cached customer reads.
 * All components should inject **this** service instead of calling
 * `CustomersService.fetchCustomers()` directly.
 *
 * ## Caching behaviour
 *
 * | Scenario                            | Result                              |
 * |-------------------------------------|-------------------------------------|
 * | Cache hit (not expired)             | Resolved Promise — zero HTTP I/O    |
 * | Concurrent calls, same filters      | Same in-flight Promise (dedup)      |
 * | Cache miss / entry expired          | New HTTP request; stored & returned |
 * | HTTP error                          | Entry removed; next call retries    |
 *
 * ## Invalidation
 *
 * - **Automatic**: whenever the selected BeyondTrust instance changes
 *   (`AppService.selectedInstanceId$`).
 * - **Manual**: call `invalidate()` after any customer mutation (create /
 *   modify / delete / deactivate / reactivate) so that all modules see
 *   fresh data on their next navigation.
 *
 * ## TTL
 *
 * Entries are valid for {@link CustomerCacheService.TTL_MS} milliseconds
 * (30 minutes by default).  This is well below the 4-hour JWT renewal
 * window, keeping data reasonably fresh even for long-lived sessions while
 * avoiding unnecessary network traffic.
 *
 * ## Page size
 *
 * The service always requests {@link CustomerCacheService.FETCH_ALL_PAGE_SIZE}
 * records internally so that filter logic in consumer components works
 * against the full dataset.  Remove this constant once the API supports
 * true server-side pagination for customer-scoped views.
 */
@Injectable({ providedIn: "root" })
export class CustomerCacheService {
    // ------------------------------------------------------------------
    // Constants
    // ------------------------------------------------------------------

    /**
     * Time-to-live for a cache entry in milliseconds.
     * Public so it can be referenced in tests without magic numbers.
     */
    public static readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

    /**
     * Page size used for every underlying HTTP request.
     * Ensures all customers are returned regardless of the API's default
     * page size until proper server-side pagination is in place.
     */
    private static readonly FETCH_ALL_PAGE_SIZE = 9999;

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------

    private readonly cache = new Map<string, CacheEntry>();

    // ------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------

    constructor(
        private readonly customersService: CustomersService,
        appService: AppService,
    ) {
        // Flush the entire cache whenever the operator switches to a
        // different BeyondTrust instance.  skip(1) ignores the initial
        // BehaviorSubject emission so we do not wipe a just-populated
        // cache on app startup.
        appService.selectedInstanceId$.pipe(distinctUntilChanged(), skip(1)).subscribe(() => this.invalidate());
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * Returns customers matching the given filters, served from cache where
     * possible.
     *
     * Callers **must not** pass `pageSize` or `pageNumber` — the service
     * handles pagination internally to guarantee a complete dataset.
     *
     * @param filters  Optional business-unit filter.  Omit (or pass `{}`)
     *                 to fetch all customers visible to the current user.
     */
    public fetchCustomers(filters: CustomerFetchFilters = {}): Promise<Customer[]> {
        const key = this.buildKey(filters);
        const entry = this.cache.get(key);

        // Return the cached Promise while still within the TTL window.
        // This covers both:
        //   a) already-resolved Promises  → instant return, zero HTTP
        //   b) still-pending Promises     → deduplication of in-flight requests
        if (entry && Date.now() < entry.expiresAt) {
            return entry.promise;
        }

        // Cache miss or stale entry — initiate a fresh request.
        const promise = this.customersService
            .fetchCustomers({
                ...filters,
                pageSize: CustomerCacheService.FETCH_ALL_PAGE_SIZE,
            })
            .then((result) => {
                // Do not retain an empty result: customers may not be
                // configured yet. Removing the entry immediately lets the
                // next caller make a fresh request instead of serving stale [].
                if (result.length === 0) {
                    this.cache.delete(key);
                }
                return result;
            })
            .catch((err: unknown) => {
                // On failure, remove the entry so the next caller triggers a
                // clean retry rather than receiving the same rejected Promise.
                this.cache.delete(key);
                throw err;
            });

        this.cache.set(key, {
            promise,
            // TTL starts from request initiation, not from response receipt.
            // For a 30-minute TTL this difference is negligible in practice.
            expiresAt: Date.now() + CustomerCacheService.TTL_MS,
        });

        return promise;
    }

    /**
     * Clears all cached entries immediately.
     *
     * **Call this after every customer mutation** (create / modify / delete /
     * deactivate / reactivate) to ensure other modules receive up-to-date
     * data on their next `fetchCustomers` call.
     *
     * The cache is also cleared automatically when the selected BeyondTrust
     * instance changes (see constructor).
     */
    public invalidate(): void {
        this.cache.clear();
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    /**
     * Produces a stable, order-independent cache key from the given filters.
     *
     * The `businessUnits` array is sorted before serialisation so that
     * `['MT', 'ENTERPRISE']` and `['ENTERPRISE', 'MT']` resolve to the same
     * entry.  `null` is used (instead of `undefined`) for the absent-filter
     * case to produce a deterministic JSON string.
     */
    private buildKey(filters: CustomerFetchFilters): string {
        return JSON.stringify({
            businessUnits: filters.businessUnits ? [...filters.businessUnits].sort() : null,
        });
    }
}
