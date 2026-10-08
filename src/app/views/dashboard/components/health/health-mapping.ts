import {
    HealthCheckDisplayItem,
    HealthCheckEntry,
    HealthCheckResponse,
    HealthRowState,
} from "./models";

/** Rows of the dashboard, in display order, with their translation keys. */
export const HEALTH_ROWS: ReadonlyArray<{ key: string; nameKey: string }> = [
    { key: "database", nameKey: "views.dashboard.health.services.database" },
    { key: "praSyncApi", nameKey: "views.dashboard.health.services.praSyncApi" },
    { key: "storage", nameKey: "views.dashboard.health.services.storage" },
    { key: "memoryHeap", nameKey: "views.dashboard.health.services.memoryHeap" },
];

export type Translate = (key: string, params?: Record<string, unknown>) => string;

const CSS_CLASSES: Record<HealthRowState, HealthCheckDisplayItem["cssClass"]> = {
    up: "online",
    warning: "warn",
    down: "offline",
    unknown: "info",
};

const MEGABYTE = 1024 * 1024;

/**
 * One row per check. The state comes from "checks" (3.2 contract), otherwise from the legacy "details". A
 * missing check is unknown (grey), never down; the overall status never overrides a row.
 */
export function mapHealthRows(
    response: HealthCheckResponse,
    translate: Translate,
): HealthCheckDisplayItem[] {
    return HEALTH_ROWS.map(({ key, nameKey }) => {
        const entry = response.checks?.[key];
        const legacy = response.details?.[key]?.status;
        const state: HealthRowState = entry?.status ?? legacy ?? "unknown";

        return {
            key,
            displayName: translate(nameKey),
            state,
            cssClass: CSS_CLASSES[state] ?? "info",
            tooltip: describeCheck(key, state, entry, translate),
            stale: false,
        };
    });
}

/** Rows without any information, e.g. when the PRA API never answered. */
export function unknownRows(translate: Translate): HealthCheckDisplayItem[] {
    return mapHealthRows({}, translate);
}

/** Keeps the last known state of every row and marks it as stale. */
export function markStale(rows: HealthCheckDisplayItem[], translate: Translate, lastUpdated: string): HealthCheckDisplayItem[] {
    return rows.map((row) => ({
        ...row,
        stale: true,
        tooltip: `${row.tooltip}\n${translate("views.dashboard.health.tooltip.stale", { time: lastUpdated })}`,
    }));
}

/** Tooltip: state, message, measured value with threshold, time of the check. */
export function describeCheck(
    key: string,
    state: HealthRowState,
    entry: HealthCheckEntry | undefined,
    translate: Translate,
): string {
    const lines = [translate(`views.dashboard.health.states.${state}`)];

    if (entry?.message) {
        lines.push(entry.message);
    }

    const measurement = describeMeasurement(key, entry, translate);

    if (measurement) {
        lines.push(measurement);
    }

    if (entry?.checkedAt) {
        lines.push(translate("views.dashboard.health.tooltip.checkedAt", { time: formatTime(entry.checkedAt) }));
    }

    return lines.join("\n");
}

function describeMeasurement(key: string, entry: HealthCheckEntry | undefined, translate: Translate): string | undefined {
    if (!entry) {
        return undefined;
    }

    const number = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

    if (key === "memoryHeap") {
        const used = number(entry.heapUsedBytes);
        const threshold = number(entry.warningThresholdBytes);

        return used !== undefined && threshold !== undefined
            ? translate("views.dashboard.health.tooltip.memory", {
                  used: Math.round(used / MEGABYTE),
                  threshold: Math.round(threshold / MEGABYTE),
              })
            : undefined;
    }

    if (key === "storage") {
        const used = number(entry.usedPercent);
        const threshold = number(entry.warningPercent);

        return used !== undefined && threshold !== undefined
            ? translate("views.dashboard.health.tooltip.storage", { used, threshold })
            : undefined;
    }

    const latency = number(entry.latencyMs);

    return latency !== undefined ? translate("views.dashboard.health.tooltip.latency", { latency }) : undefined;
}

export function formatTime(iso: string | Date): string {
    const date = typeof iso === "string" ? new Date(iso) : iso;

    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en-GB", { hour12: false });
}
