import { AccessPermissionStatusType } from "../enums";

export interface GroupPolicy {
    id: number;
    name: string;
    hasEndpointsAccessPermission?: boolean;
    accessPermissionStatusType?: AccessPermissionStatusType;
    hasShareOtherTeamPermission?: boolean;
    hasInviteExternalUserPermission?: boolean;
    userSessionIdleTimeoutInSeconds?: number;
    hasEnableExtendedAvailabilityModePermission?: boolean;
    hasEditExternalKeyPermission?: boolean;
    hasCollaboratePermission?: boolean;
    hasCollaborateControlPermission?: boolean;
    hasJumpClientPermission?: boolean;
    hasLocalJumpPermission?: boolean;
    hasRemoteJumpPermission?: boolean;
    hasRemoteVncPermission?: boolean;
    hasRemoteRdpPermission?: boolean;
    hasShellJumpPermission?: boolean;
    hasWebJumpPermission?: boolean;
    hasProtocolTunnelPermission?: boolean;
    hasSdStaticPortForExternalToolsPermission?: boolean;
    defaultJumpItemRoleId?: number;
    privateJumpItemRoleId?: number;
    inferiorJumpItemRoleId?: number;
    unassignedJumpItemRoleId?: number;
    lastSyncDate: string; // ISO string!

    /* temporary */
    groupMembersCount?: number;
}
