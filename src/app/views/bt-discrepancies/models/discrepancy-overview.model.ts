import { DiscrepancyEntityType } from "../enums";

export interface DiscrepancyOverview {
    entityType: DiscrepancyEntityType;
    count: number;
    scannedAt: Date;
}
