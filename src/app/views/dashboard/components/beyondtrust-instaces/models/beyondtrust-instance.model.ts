import { BillingType } from "../enums";

export interface BeyondtrustInstance {
    id: number;
    name: string;
    authClientId: string;
    authClientSecret: string;
    oauth2TokenUrl: string;
    apiBaseUrl: string;
    billingType: BillingType;
    creationDate: Date;
    lastModificationDate?: Date;
}
