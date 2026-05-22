/**
 * API-level defaults used when communicating with the PRA / BeyondTrust API.
 * Not related to UI presentation.
 */
export const BtApiDefaults = {
    /**
     * pageSize value used in "fetch-all" requests where server-side pagination
     * is bypassed intentionally (e.g. dropdown population).
     * TODO: Replace per-service once server-side pagination is fully implemented.
     */
    FETCH_ALL_PAGE_SIZE: "9999",

    /**
     * Service type sent when deploying a new Jumpoint node via
     * POST deployments/jumpoint-nodes/{id}/services.
     */
    DEPLOYMENT_SERVICE_TYPE: "pra",
} as const;
