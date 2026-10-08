import { DiscrepancyEntityType } from "./enums";

const ENTITY_TYPE_LABELS: Record<DiscrepancyEntityType, string> = {
    [DiscrepancyEntityType.GroupPolicy]: "Group Policy",
    [DiscrepancyEntityType.GroupPolicyJumpGroup]: "Group Policy Jump Group",
    [DiscrepancyEntityType.GroupPolicyJumpoint]: "Group Policy Jumpoint",
    [DiscrepancyEntityType.GroupPolicyMember]: "Group Policy Member",
    [DiscrepancyEntityType.GroupPolicyTeam]: "Group Policy Team",
    [DiscrepancyEntityType.JumpClient]: "Jump Client",
    [DiscrepancyEntityType.JumpClientInstaller]: "Jump Client Installer",
    [DiscrepancyEntityType.JumpGroup]: "Jump Group",
    [DiscrepancyEntityType.JumpItemProtocolTunnelJump]: "Jump Item (Protocol Tunnel)",
    [DiscrepancyEntityType.JumpItemRemoteRdp]: "Jump Item (Remote RDP)",
    [DiscrepancyEntityType.JumpItemRemoteVnc]: "Jump Item (Remote VNC)",
    [DiscrepancyEntityType.JumpItemShellJump]: "Jump Item (Shell Jump)",
    [DiscrepancyEntityType.JumpItemWebJump]: "Jump Item (Web Jump)",
    [DiscrepancyEntityType.JumpPolicy]: "Jump Policy",
    [DiscrepancyEntityType.Jumpoint]: "Jumpoint",
    [DiscrepancyEntityType.JumpointNode]: "Jumpoint Node",
    [DiscrepancyEntityType.Team]: "Team",
    [DiscrepancyEntityType.TeamUser]: "Team User",
    [DiscrepancyEntityType.User]: "User",
    [DiscrepancyEntityType.UserGroupPolicy]: "User Group Policy",
};

/** Display name of an entity type in the discrepancy view; an unknown type is shown as sent by the PRA API. */
export function getEntityTypeLabel(entityType: string): string {
    return ENTITY_TYPE_LABELS[entityType as DiscrepancyEntityType] ?? entityType;
}
