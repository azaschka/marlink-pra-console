import { BusinessUnit } from "app/views/pra-users/enums";

export interface RetrieveBeyondtrustInstancesParams {
    pageSize?: number;
    pageNumber?: number;
    name?: string;
    oauth2TokenUrl?: string;
    apiBaseUrl?: string;
    businessUnits?: BusinessUnit[];
}
