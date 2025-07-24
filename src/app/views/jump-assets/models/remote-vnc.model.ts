import { JumpGroupType } from "../enums";

export interface RemoteVnc {
    /* required */
    id: number;
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;
    lastSyncDate: Date;

    /* optional */
    port?: number;
    jumpGroupType?: JumpGroupType;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number | null;
    sessionPolicyId?: number | null;
}
