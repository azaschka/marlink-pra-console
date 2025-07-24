import {
    JumpGroupType,
    ShellJumpProtocolType,
    ShellJumpTerminalType,
} from "../enums";

export interface ShellJump {
    /* required */
    id: number;
    name: string;
    jumpointId: number;
    hostname: string;
    protocolType: ShellJumpProtocolType;
    jumpGroupId: number;
    lastSyncDate: Date;

    /* optional */
    port?: number;
    jumpGroupType?: JumpGroupType;
    terminalType?: ShellJumpTerminalType;
    keepAliveIdleSessionInSeconds?: number;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number | null;
    username?: string;
    sessionPolicyId?: number | null;
}
