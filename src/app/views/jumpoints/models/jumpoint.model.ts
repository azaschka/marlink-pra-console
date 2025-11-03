import {
    JumpointPlatformType,
    JzpClientAddressRestrictionsType,
} from "../enums";
import { JumpointIpRange } from "./jumpoint-ip-range.model";

export interface Jumpoint {
    id: number;
    name: string;
    platformType: JumpointPlatformType;
    codeName?: string;
    comments?: string;
    isEnabled?: boolean;
    isConnected?: boolean;
    isClustered?: boolean;
    isShellJumpEnabled?: boolean;
    externalJumpItemNetworkId?: string;
    isProtocolTunnelEnabled?: boolean;
    rdpServiceAccountId?: number | null;
    managedIpRanges?: JumpointIpRange[];
    isJzpEnabled?: boolean;
    jzpProxyHostname?: string;
    jzpProxyPort?: number;
    isJzpHttpGetAllowed?: boolean;
    jzpClientAddressRestrictionsType?: JzpClientAddressRestrictionsType;
    jzpRestrictedIps?: string[];
    dockerDeployKey?: string;
    keyInfo?: string;
    lastSyncDate: Date;
}
