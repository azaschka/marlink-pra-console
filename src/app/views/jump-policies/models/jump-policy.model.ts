import {
    ApprovalApproverScopeType,
    ApprovalScopeType,
    SimultaneousJumpsRdpType,
    SimultaneousJumpsType,
} from "../enums";

export interface JumpPolicy {
    id: number;
    displayName: string;
    codeName?: string;
    description?: string;
    hasScheduledAccessRestriction?: boolean;
    simultaneousJumpsType?: SimultaneousJumpsType;
    doesSimultaneousJumpBehaviorApplyToCopies?: boolean;
    simultaneousJumpsRdpType?: SimultaneousJumpsRdpType;
    shouldForceRemoveUsersWhenScheduleDisallows?: boolean;
    isTicketIdRequired?: boolean;
    isTwoFactorChallengeRequired?: boolean;
    isSessionStartNotificationEnabled?: boolean;
    isSessionEndNotificationEnabled?: boolean;
    notificationEmailAddresses?: string[];
    notificationDisplayName?: string;
    notificationEmailLanguage?: string;
    isApprovalRequired?: boolean;
    approvalMaxDurationInMinutes?: number;
    approvalScopeType?: ApprovalScopeType;
    approvalEmailAddresses?: string[];
    approvalUserIds?: string[];
    approvalTeamIds?: string[];
    approvalDisplayName?: string;
    approvalEmailLanguage?: string;
    approvalApproverScopeType?: ApprovalApproverScopeType;
    isRecordingsDisabled?: boolean;
    lastSyncDate: string; // ISO String
}
