import { DiscrepancyScanStatus } from "../enums";

/** An entity type whose scan did not succeed (PRA API 3.2 and later). */
export interface ScanEntityTypeFailure {
    entityType: string;
    /** failed, partial, skipped or aborted */
    state: string;
    /** Error kind from the Sync API, or the HTTP status and a short message of the failed call. */
    reason?: string;
}

export interface ScanStatusResponse {
    scanId: string;
    status: DiscrepancyScanStatus;
    startedAt: string;
    completedAt?: string;
    error?: string;
    /** Absent when every entity type succeeded, and with PRA API versions before 3.2. */
    failedEntityTypes?: ScanEntityTypeFailure[];
}
