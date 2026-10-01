import { DiscrepancyScanStatus } from "./enums";
import { ScanEntityTypeFailure, ScanStatusResponse } from "./models";

export interface ScanResultDisplay {
    /** Short notification, or null when the result is shown as an error only. */
    notification: string | null;
    /** Entity types that could not be scanned (amber), or null. */
    warning: string | null;
    /** Error text (red), or null. */
    error: string | null;
}

/** Turns a finished manual scan into the texts the discrepancy view shows. Pure, so that it can be tested. */
export function describeScanResult(status: ScanStatusResponse): ScanResultDisplay {
    const failures = status.failedEntityTypes ?? [];

    if (status.status === DiscrepancyScanStatus.Failed) {
        const error = status.error ?? "Scan failed. Please try again.";
        const details = describeFailures(failures);

        return {
            notification: null,
            warning: null,
            error: details ? `${/[.!?]$/.test(error) ? error : `${error}.`} ${details}` : error,
        };
    }

    if (failures.length === 0) {
        return { notification: "Discrepancy scan completed successfully.", warning: null, error: null };
    }

    return {
        notification: `Discrepancy scan completed, but ${countText(failures.length)} could not be scanned.`,
        warning: `${describeFailures(failures)} Their discrepancies may be outdated.`,
        error: null,
    };
}

function describeFailures(failures: ScanEntityTypeFailure[]): string {
    if (failures.length === 0) {
        return "";
    }

    const items = failures.map(
        (failure) => `${failure.entityType} (${failure.state}${failure.reason ? `: ${failure.reason}` : ""})`,
    );

    return `Not scanned: ${items.join(", ")}.`;
}

function countText(count: number): string {
    return count === 1 ? "1 entity type" : `${count} entity types`;
}
