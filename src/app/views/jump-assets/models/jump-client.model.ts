import {
    JumpClientConnectionType,
    JumpClientEndpointAgreementPolicyType,
    JumpClientGroupType,
    JumpClientInstallMode,
    JumpClientUnavailableReasonType,
} from "../enums";

export interface JumpClient {
    /* required */
    id: number;
    jumpGroupId: number;
    lastSyncDate: Date;

    /* optional */
    jumpGroupType?: JumpClientGroupType;
    name?: string;
    hostname?: string;
    fqdn?: string;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number | null;
    sessionPolicyId?: number | null;
    installMode?: JumpClientInstallMode;
    connectionType?: JumpClientConnectionType;
    lastConnectDate?: Date;
    lastDisconnectDate?: Date;
    isLost?: boolean;
    needsUpdate?: boolean;
    unavailableReasonType?: JumpClientUnavailableReasonType;
    operatingSystem?: string;
    publicIp?: string;
    privateIp?: string;
    consoleUser?: string;
    expirationDate?: Date;
    maxOfflineDurationInMinutes?: number;
    lastAccessDate?: Date;
    endpointAgreementPolicyType?: JumpClientEndpointAgreementPolicyType;
    jumpointProxy?: string | null;
}
