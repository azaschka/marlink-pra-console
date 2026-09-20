import { JumpGroupType, TunnelType } from "../enums";

export interface CreateProtocolTunnelJumpDtoInput {
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;
    jumpGroupType?: JumpGroupType;
    tag: string;
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
}
