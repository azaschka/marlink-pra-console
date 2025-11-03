import {
    UserAllowedAccessPermissionType,
    UserEndpointAutomationPermissionType,
    UserViewSupportReportsPermissionType,
    UserViewVaultReportsPermissionType,
} from "../enums";

export interface User {
    id: number;
    publicDisplayName: string;
    securityProviderId?: number;
    username?: string;
    passwordExpirationDate?: string | null;
    email?: string;
    preferredEmailLanguage?: string;
    isTwoFactorAuthRequired?: boolean;
    isLoginAllowed?: boolean;
    lastAuthenticationDate?: string;
    failedLoginAttempts?: number;
    mustResetPasswordOnNextLogin?: boolean;
    creationDate?: string;
    hasTwoFactorAuthEnabled?: boolean;
    fido2CredentialCount?: number;
    fido2LastUsedDate?: string;
    hasAdminPermission?: boolean;
    hasSetPasswordsPermission?: boolean;
    hasAdminPushagentPermission?: boolean;
    viewSupportReportsPermissionType?: UserViewSupportReportsPermissionType;
    viewVaultReportsPermissionType?: UserViewVaultReportsPermissionType;
    hasViewSyslogReportsPermission?: boolean;
    hasViewSdRecordingsPermission?: boolean;
    hasEditJumpGroupsPermission?: boolean;
    hasEditSdTeamsPermission?: boolean;
    hasEditCannedScriptsPermission?: boolean;
    hasEditCustomRepLinksPermission?: boolean;
    allowedAccessPermissionType?: UserAllowedAccessPermissionType;
    hasShareOtherTeamPermission?: boolean;
    hasInviteExternalUserPermission?: boolean;
    hasExtendedAvailabilityModeAllowedPermission?: boolean;
    hasEditExternalKeyPermission?: boolean;
    sessionInactivityTimeoutInSeconds?: number;
    hasCollaboratePermission?: boolean;
    hasCollaborateControlPermission?: boolean;
    hasJumpClientPermission?: boolean;
    hasLocalJumpPermission?: boolean;
    hasRemoteJumpPermission?: boolean;
    hasRemoteVncPermission?: boolean;
    hasRemoteRdpPermission?: boolean;
    hasShellJumpPermission?: boolean;
    defaultJumpItemRoleId?: number;
    privateJumpItemRoleId?: number;
    inferiorJumpItemRoleId?: number;
    unassignedJumpItemRoleId?: number;
    hasWebJumpPermission?: boolean;
    hasProtocolTunnelPermission?: boolean;
    hasSdStaticPortForExternalToolsPermission?: boolean;
    hasVaultPermission?: boolean;
    endpointAutomationPermissionType?: UserEndpointAutomationPermissionType;
    lastSyncDate: string;
}
