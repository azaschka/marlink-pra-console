import { SortOrderType } from "../../../shared/enums";

export interface RetrieveLogsParams {
    pageSize?: number;
    pageNumber?: number;
    creationDateFrom?: Date;
    creationDateTo?: Date;
    sortOrderType?: SortOrderType;
}
