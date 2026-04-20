import { CustomerBusinessUnit } from "../enums";

export interface RetrieveCustomersParams {
    pageSize?: number;
    pageNumber?: number;
    key?: string;
    name?: string;
    businessUnits?: CustomerBusinessUnit[];
}
