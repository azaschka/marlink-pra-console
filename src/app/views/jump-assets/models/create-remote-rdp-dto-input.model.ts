import { JumpGroupType, RdpQualityMode, SecureAppType } from "../enums";

export interface CreateRemoteRdpDtoInput {
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;
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
    secureAppType?: SecureAppType;
    remoteAppName?: string;
    remoteAppParams?: string;
    remoteExePath?: string;
    remoteExeParams?: string;
    targetSystem?: string;
    credentialType?: string;
}
