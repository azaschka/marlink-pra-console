import { CustomerBillingType } from "../enums";
import { CustomerAssetLicenseUsageSourceData } from "./customer-asset-license-usage-source-data.model";
import { CustomerUserLicenseUsageSourceData } from "./customer-user-license-usage-source-data.model";

export interface CustomerLicenseUsage {
    customerId: number;
    billingType: CustomerBillingType;
    totalLicenseUsage: number;
    licenseUsageSourceData:
        | CustomerUserLicenseUsageSourceData[]
        | CustomerAssetLicenseUsageSourceData[];
}
