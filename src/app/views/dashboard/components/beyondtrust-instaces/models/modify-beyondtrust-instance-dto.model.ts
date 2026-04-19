import { BillingType } from "../enums";
import { BusinessUnit } from "app/views/pra-users/enums";

export interface ModifyBeyondtrustInstanceDto {
    name?: string;
    authClientId?: string;
    authClientSecret?: string;
    oauth2TokenUrl?: string;
    apiBaseUrl?: string;
    billingType?: BillingType;
    businessUnit?: BusinessUnit | null;
}
