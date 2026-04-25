import { CustomerBillingType } from "../../customers/enums";
import { CustomerAssetLicenseUsageSourceData } from "../../customers/models/customer-asset-license-usage-source-data.model";
import { CustomerUserLicenseUsageSourceData } from "../../customers/models/customer-user-license-usage-source-data.model";

export interface SiteLicenseUsage {
    siteId: number;
    billingType: CustomerBillingType;
    totalLicenseUsage: number;
    licenseUsageSourceData:
        | CustomerUserLicenseUsageSourceData[]
        | CustomerAssetLicenseUsageSourceData[];
}
