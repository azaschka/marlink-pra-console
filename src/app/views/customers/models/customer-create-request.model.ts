import { CustomerBillingType, CustomerBusinessUnit } from "../enums";

export interface CustomerCreateRequest {
    key: string;
    name: string;
    businessUnit: CustomerBusinessUnit;
    billingType: CustomerBillingType;
}
