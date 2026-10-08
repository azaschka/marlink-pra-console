import { DiscrepancyScanStatus } from "./enums";
import { getEntityTypeLabel } from "./entity-type-labels";
import { ScanEntityTypeFailure, ScanStatusResponse } from "./models";

export type Translate = (key: string, params?: Record<string, unknown>) => string;

export interface ScanResultDisplay {
    /** Short notification, or null when the result is shown as an error only. */
    notification: string | null;
    /** Entity types that could not be scanned (amber), or null. */
    warning: string | null;
    /** Error text (red), or null. */
    error: string | null;
}

const KEY = "views.bt-discrepancies.scan";
const KNOWN_STATES: ReadonlySet<string> = new Set(["failed", "partial", "skipped", "aborted"]);

/** Turns a finished manual scan into the texts the discrepancy view shows. */
export function describeScanResult(status: ScanStatusResponse, translate: Translate): ScanResultDisplay {
    const failures = status.failedEntityTypes ?? [];

    if (status.status === DiscrepancyScanStatus.Failed) {
        const error = status.error ?? translate(`${KEY}.failed`);
        const details = describeFailures(failures, translate);

        return {
            notification: null,
            warning: null,
            error: details ? `${/[.!?]$/.test(error) ? error : `${error}.`} ${details}` : error,
        };
    }

    if (failures.length === 0) {
        return { notification: translate(`${KEY}.completed`), warning: null, error: null };
    }

    const count = translate(failures.length === 1 ? `${KEY}.entityTypeCount.one` : `${KEY}.entityTypeCount.other`, {
        count: failures.length,
    });

    return {
        notification: translate(`${KEY}.completedWithFailures`, { count }),
        warning: `${describeFailures(failures, translate)} ${translate(`${KEY}.outdated`)}`,
        error: null,
    };
}

function describeFailures(failures: ScanEntityTypeFailure[], translate: Translate): string {
    if (failures.length === 0) {
        return "";
    }

    const items = failures.map((failure) => {
        const params = {
            entityType: getEntityTypeLabel(failure.entityType),
            state: KNOWN_STATES.has(failure.state) ? translate(`${KEY}.states.${failure.state}`) : failure.state,
            reason: failure.reason,
        };

        return translate(failure.reason ? `${KEY}.itemWithReason` : `${KEY}.item`, params);
    });

    return translate(`${KEY}.notScanned`, { items: items.join(", ") });
}
