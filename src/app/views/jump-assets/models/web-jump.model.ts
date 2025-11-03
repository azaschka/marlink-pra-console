import { JumpGroupType, WebJumpUsernameFormatType } from "../enums";

export interface WebJump {
    /* required */
    id: number;
    name: string;
    jumpointId: number;
    url: string;
    jumpGroupId: number;
    lastSyncDate: Date;

    /* optional */
    jumpGroupType?: JumpGroupType;
    usernameFormatType?: WebJumpUsernameFormatType;
    mustVerifyCertificate?: boolean;
    authenticationTimeoutInSeconds?: number;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number | null;
    usernameField?: string | null;
    passwordField?: string | null;
    submitField?: string | null;
    sessionPolicyId?: number | null;

    /* temporary */
    jumpGroupName?: string;
    jumpointName?: string;
    jumpPolicyName?: string;
}
