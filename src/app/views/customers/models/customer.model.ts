import { CustomerBusinessUnit } from "../enums";

export interface Customer {
    id: number;
    key: string;
    name: string;
    businessUnit: CustomerBusinessUnit;
    isDeactivated: boolean;
    beyondtrustInstanceId: number;
    creationDate: string | Date;
    lastModificationDate?: string | Date;
    totalLicenseUsage?: number;
    licenseUsageLoading?: boolean;
}
