import { CustomerBusinessUnit } from "../enums";

export interface CustomerCreateRequest {
    key: string;
    name: string;
    businessUnit: CustomerBusinessUnit;
    beyondtrustInstanceId: number;
}
