import {
    JumpGroupType,
    ShellJumpProtocolType,
    ShellJumpTerminalType,
} from "../enums";

export interface CreateShellJumpDtoInput {
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;
    protocolType: ShellJumpProtocolType;

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
