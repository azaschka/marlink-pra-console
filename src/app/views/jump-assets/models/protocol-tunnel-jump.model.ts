import { JumpGroupType, TunnelType } from "../enums";

export interface ProtocolTunnelJump {
    /* required */
    id: number;
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;
    lastSyncDate: Date;

    /* optional */
    jumpGroupType?: JumpGroupType;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number | null;
    sessionPolicyId?: number | null;
    tunnelListenAddress?: string;
    tunnelDefinitions?: string;
    tunnelType?: TunnelType;
    username?: string;
    database?: string;
    url?: string;
    caCertificates?: string;

    /* temporary */
    jumpGroupName?: string;
    jumpointName?: string;
    jumpPolicyName?: string;
}
