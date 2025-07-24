import { JumpGroupType, RdpQualityMode, SecureAppType } from "../enums";

export interface RemoteRdp {
    /* required */
    id: number;
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;
    lastSyncDate: Date;

    /* optional */
    jumpGroupType?: JumpGroupType;
    qualityMode?: RdpQualityMode;
    mustStartNewConsoleSession?: boolean;
    mustIgnoreUntrustedServerCert?: boolean;
    tag?: string;
    comments?: string;
    rdpUsername?: string;
    domain?: string;
    jumpPolicyId?: number | null;
    isSessionForensicsEnabled?: boolean;
    sessionPolicyId?: number | null;
    endpointId?: number | null;
    secureAppType?: SecureAppType;
    remoteAppName?: string;
    remoteAppParams?: string;
    remoteExePath?: string;
    remoteExeParams?: string;
    targetSystem?: string;
    credentialType?: string;
}
