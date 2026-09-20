import { JumpClientConnectionType, JumpClientGroupType } from "../enums";

export interface CreateJumpClientInstallerDtoInput {
    name?: string;
    jumpGroupId: number;
    jumpGroupType?: JumpClientGroupType;
    jumpPolicyId?: number;
    tag: string;
    connectionType?: JumpClientConnectionType;
    sessionPolicyId?: number | null;
    comments?: string;
    validDurationInMinutes?: number;
    shouldElevateInstall?: boolean;
    shouldElevatePrompt?: boolean;
    canOverrideJumpGroup?: boolean;
    canOverrideJumpPolicy?: boolean;
    canOverrideName?: boolean;
    canOverrideTag?: boolean;
    canOverrideComments?: boolean;
    canOverrideSessionPolicy?: boolean;
    jumpointProxy?: string;
}
