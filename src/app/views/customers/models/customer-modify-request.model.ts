import { CustomerBillingType } from "../enums";

export interface CustomerModifyRequest {
    billingType?: CustomerBillingType;
}
