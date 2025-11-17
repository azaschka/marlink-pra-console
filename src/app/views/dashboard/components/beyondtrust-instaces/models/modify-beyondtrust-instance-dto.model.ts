import { BillingType } from "../enums";

export interface ModifyBeyondtrustInstanceDto {
    name?: string;
    authClientId?: string;
    authClientSecret?: string;
    oauth2TokenUrl?: string;
    apiBaseUrl?: string;
    billingType?: BillingType;
}
