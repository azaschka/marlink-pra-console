import {
    JumpClientConnectionType,
    JumpClientGroupType,
} from "../../views/jump-assets/enums";

/**
 * Defaults applied to all Jump Client Installer records (not exposed in the UI).
 * Used identically by the site-import workflow and the manual create overlay.
 */
export const BtJumpClientDefaults = {
    jumpGroupType: JumpClientGroupType.Shared,
    connectionType: JumpClientConnectionType.Active,
    validDurationInMinutes: 43200, // 30 days
    shouldElevateInstall: true,
    shouldElevatePrompt: true,
    canOverrideJumpGroup: false,
    canOverrideJumpPolicy: false,
    canOverrideName: false,
    canOverrideTag: false,
    canOverrideComments: false,
    canOverrideSessionPolicy: false,
} as const;
