import { DiscrepancyScanStatus } from "../enums";

export interface ScanStatusResponse {
    scanId: string;
    status: DiscrepancyScanStatus;
    startedAt: string;
    completedAt?: string;
    error?: string;
}
