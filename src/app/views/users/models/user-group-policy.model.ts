import { GroupPolicy } from "app/views/group-policies/models";

export interface UserGroupPolicy {
    userId: number;
    groupPolicyId: number;
    groupPolicy: GroupPolicy;
}
