/** Status of one check in the health contract of the PRA API (3.2 and later). */
export type HealthCheckStatus = "up" | "warning" | "down";

/** State of one row in the dashboard; unknown when no information is available. */
export type HealthRowState = HealthCheckStatus | "unknown";

export interface HealthCheckEntry {
    status: HealthCheckStatus;
    critical?: boolean;
    message?: string;
    checkedAt?: string;
    [measurement: string]: unknown;
}

/** Legacy Terminus fields: only up and down. */
export interface HealthCheckServiceStatus {
    status: "up" | "down";
}

export interface HealthCheckResponse {
    status?: "ok" | "error";
    info?: Record<string, HealthCheckServiceStatus>;
    error?: Record<string, HealthCheckServiceStatus>;
    details?: Record<string, HealthCheckServiceStatus>;
    /** Since 3.2: healthy, degraded or unavailable. */
    overallStatus?: "healthy" | "degraded" | "unavailable";
    checkedAt?: string;
    /** Since 3.2: per check status, message, measured values and thresholds. */
    checks?: Record<string, HealthCheckEntry>;
}

/** Result of one poll: a health answer (HTTP 200 or 503 with a body), or no usable answer at all. */
export type HealthFetchResult = { kind: "response"; body: HealthCheckResponse } | { kind: "unreachable" };

export interface HealthCheckDisplayItem {
    key: string;
    displayName: string;
    state: HealthRowState;
    cssClass: "online" | "warn" | "offline" | "info";
    tooltip: string;
    /** True when the row shows the last known state because the PRA API did not answer. */
    stale: boolean;
}
