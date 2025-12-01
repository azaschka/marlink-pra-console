import { DiscrepancyEntityType } from "../enums";

export interface RetrieveDiscrepanciesParams {
    pageSize?: number;
    pageNumber?: number;
    entityType?: DiscrepancyEntityType;
    entityId?: number;
}
