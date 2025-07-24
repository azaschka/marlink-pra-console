export interface GroupPolicyAddMemberRequest {
    userId: number;
    securityProviderId: number;
    distinguishedName?: string;
    groupName?: string;
}
