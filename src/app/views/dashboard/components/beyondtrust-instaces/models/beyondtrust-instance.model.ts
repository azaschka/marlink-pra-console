import { BillingType } from "../enums";
import { BusinessUnit } from "app/views/pra-users/enums";

export interface BeyondtrustInstance {
    id: number;
    name: string;
    authClientId: string;
    authClientSecret: string;
    oauth2TokenUrl: string;
    apiBaseUrl: string;
    billingType: BillingType;
    businessUnit: BusinessUnit | null;
    cname: string | null;
    creationDate: Date;
    lastModificationDate?: Date;
}
