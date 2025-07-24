import { CustomerJumpItemType } from "../enums";

export interface CustomerAssetLicenseUsageSourceData {
    groupPolicyJumpGroupLastSyncDate: string | Date;
    jumpGroupId: number;
    jumpGroupName: string;
    jumpGroupLastSyncDate: string | Date;
    jumpItemType: CustomerJumpItemType;
    jumpItemId: number;
    jumpItemName?: string;
    jumpItemJumpointId?: number;
    jumpItemHostname?: string;
    jumpItemEndpointUrl?: string;
    jumpItemFqdn?: string;
    jumpItemLastSyncDate: string | Date;
    groupPolicyId: number;
    groupPolicyName: string;
    groupPolicyLastSyncDate: string | Date;
}
