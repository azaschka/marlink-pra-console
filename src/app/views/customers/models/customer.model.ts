import { CustomerBillingType, CustomerBusinessUnit } from "../enums";

export interface Customer {
    id: number;
    key: string;
    name: string;
    businessUnit: CustomerBusinessUnit;
    isDeactivated: boolean;
    billingType: CustomerBillingType;
    creationDate: string | Date;
    lastModificationDate?: string | Date;
    totalLicenseUsage?: number;
    licenseUsageLoading?: boolean;
}
