export interface HealthCheckServiceStatus {
    status: "up" | "down";
}

export interface HealthCheckInfo {
    database?: HealthCheckServiceStatus;
    storage?: HealthCheckServiceStatus;
    memoryHeap?: HealthCheckServiceStatus;
    praSyncApi?: HealthCheckServiceStatus;
}

export interface HealthCheckResponse {
    status: "ok" | "error";
    info: HealthCheckInfo;
    error: HealthCheckInfo;
    details: HealthCheckInfo;
}

export interface HealthCheckDisplayItem {
    key: string;
    displayName: string;
    status: "up" | "down";
    cssClass: "online" | "offline";
}
