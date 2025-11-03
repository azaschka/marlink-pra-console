import { JumpClientConnectionType, JumpClientGroupType } from "../enums";
import { JumpClientInstallerKeyInfo } from "./jump-client-installer-key-info.model";

export interface JumpClientInstaller {
    id: number;
    jumpGroupId: number;
    jumpGroupType?: JumpClientGroupType;
    name?: string;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number;
    sessionPolicyId?: number | null;
    connectionType?: JumpClientConnectionType;
    expirationDate?: Date;
    maxOfflineDurationInMinutes?: number;
    shouldElevateInstall?: boolean;
    shouldElevatePrompt?: boolean;
    canOverrideJumpGroup?: boolean;
    canOverrideJumpPolicy?: boolean;
    canOverrideName?: boolean;
    canOverrideTag?: boolean;
    canOverrideComments?: boolean;
    canOverrideSessionPolicy?: boolean;
    installerId?: string;
    keyInfo?: JumpClientInstallerKeyInfo[];
    jumpointProxy?: string | null;
    lastSyncDate: Date;
}
